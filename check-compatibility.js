const fs = require('fs');

function esCompatibleBackward(schemaViejo, schemaNuevo) {
  const problemas = [];
  const reqNuevo = new Set(schemaNuevo.required || []);
  const reqViejo = new Set(schemaViejo.required || []);

  for (const campo of reqNuevo) {
    // Desviacion 2: un campo que pasa a ser requerido sin default es breaking
    // aunque ya existiera como opcional (la guia exigia que no existiera).
    if (!reqViejo.has(campo) && schemaNuevo.properties?.[campo]?.default === undefined) {
      problemas.push(`Campo requerido nuevo sin default: ${campo}`);
    }
  }
  for (const campo of Object.keys(schemaViejo.properties || {})) {
    if (!(campo in (schemaNuevo.properties || {}))) {
      problemas.push(`Campo eliminado: ${campo}`);
    }
  }
  for (const campo of Object.keys(schemaViejo.properties || {})) {
    const tViejo = schemaViejo.properties[campo]?.type;
    const tNuevo = schemaNuevo.properties?.[campo]?.type;
    if (tNuevo && tViejo !== tNuevo) {
      problemas.push(`Tipo cambiado en ${campo}: ${tViejo} -> ${tNuevo}`);
    }
  }
  return { compatible: problemas.length === 0, problemas };
}

module.exports = { esCompatibleBackward };

if (require.main === module) {
  const viejo = JSON.parse(fs.readFileSync(process.argv[2]));
  const nuevo = JSON.parse(fs.readFileSync(process.argv[3]));
  console.log(JSON.stringify(esCompatibleBackward(viejo, nuevo), null, 2));
}
