#!/usr/bin/env node
/**
 * Genera un script JScript independiente para importar el diseño de datos
 * de Infinipaper en Enterprise Architect.
 *
 * Uso: node docs/sdd/ea/generar-diseno-datos.mjs
 *
 * El script resultante crea el paquete `Infinipaper · Diseño de datos` con
 * cuatro diagramas de clases y aborta si el paquete ya existe.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(here, "modelo.json");
const designPath = path.join(here, "diseno-datos.json");
const outPath = path.join(here, "importar-diseno-datos.js");

const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
const design = JSON.parse(fs.readFileSync(designPath, "utf8"));

function fail(message) {
  console.error(`Error de diseño de datos: ${message}`);
  process.exit(1);
}

const classMap = new Map();
for (const cls of model.classModel.classes) {
  if (classMap.has(cls.name)) fail(`clase duplicada: ${cls.name}`);
  classMap.set(cls.name, cls);
}

const enumNames = new Set(model.classModel.enums.map((en) => en.name));
const diagramKeys = new Set();
const coveredClasses = new Set();

for (const diagram of design.diagrams) {
  if (!diagram.key || !diagram.name) fail("diagrama sin key o nombre");
  if (diagramKeys.has(diagram.key)) fail(`diagrama duplicado: ${diagram.key}`);
  diagramKeys.add(diagram.key);
  if (!Array.isArray(diagram.classes) || diagram.classes.length === 0) {
    fail(`el diagrama ${diagram.key} no tiene clases`);
  }
  const seen = new Set();
  for (const name of diagram.classes) {
    if (!classMap.has(name)) fail(`el diagrama ${diagram.key} referencia una clase inexistente: ${name}`);
    if (seen.has(name)) fail(`clase duplicada en ${diagram.key}: ${name}`);
    seen.add(name);
    coveredClasses.add(name);
  }
}

const missing = [...classMap.keys()].filter((name) => !coveredClasses.has(name));
if (missing.length) fail(`clases fuera de todas las vistas: ${missing.join(", ")}`);

for (const key of Object.keys(design.layout ?? {})) {
  if (!["x", "y", "columns", "gapX", "gapY", "width", "height"].includes(key)) {
    fail(`propiedad de layout no soportada: ${key}`);
  }
}

for (const [name, attributes] of Object.entries(design.keyAttributes ?? {})) {
  if (!classMap.has(name)) fail(`keyAttributes referencia una clase inexistente: ${name}`);
  const available = new Set(classMap.get(name).attributes.map((attr) => attr.name));
  for (const attribute of attributes) {
    if (!available.has(attribute)) {
      fail(`keyAttributes de ${name} referencia un atributo inexistente: ${attribute}`);
    }
  }
}

const overrides = design.relationshipOverrides ?? [];
const relationships = model.classModel.relations
  .filter((rel) => classMap.has(rel.from) && classMap.has(rel.to))
  .map((rel) => {
    const override = overrides.find(
      (item) =>
        item.from === rel.from &&
        item.to === rel.to &&
        (item.label ?? "") === (rel.label ?? "")
    );
    return {
      from: rel.from,
      to: rel.to,
      label: rel.label ?? "",
      type: override?.type ?? rel.type ?? "Association",
      fromMultiplicity: rel.fromMultiplicity ?? "",
      toMultiplicity: rel.toMultiplicity ?? "",
      notes: rel.notes ?? "",
    };
  });

for (const override of overrides) {
  const found = relationships.some(
    (rel) =>
      rel.from === override.from &&
      rel.to === override.to &&
      rel.label === (override.label ?? "")
  );
  if (!found) fail(`override sin relación: ${override.from} -> ${override.to}`);
}

const payload = {
  rootPackage: design.rootPackage,
  notes: design.notes,
  layout: design.layout,
  diagrams: design.diagrams,
  classes: model.classModel.classes.map((cls) => {
    const selected = design.keyAttributes?.[cls.name];
    const attributes = selected
      ? cls.attributes.filter((attr) => selected.includes(attr.name))
      : cls.attributes;
    return {
      name: cls.name,
      notes: cls.notes ?? "",
      attributes: attributes.map((attr) => ({
        name: attr.name,
        type: attr.type,
        notes: attr.notes ?? "",
      })),
    };
  }),
  relationships,
  enums: model.classModel.enums.map((en) => ({
    name: en.name,
    values: en.values,
  })),
};

const runtime = String.raw`
function out(message) {
  if (typeof Session !== "undefined" && Session.Output) {
    Session.Output("[Diseño de datos] " + message);
  }
}

function findByName(collection, name) {
  try {
    return collection.GetByName(name);
  } catch (e) {
    return null;
  }
}

function ensureElement(pkg, name, type, notes) {
  var element = findByName(pkg.Elements, name);
  if (!element) {
    element = pkg.Elements.AddNew(name, type);
  }
  if (notes) element.Notes = notes;
  element.Update();
  return element;
}

function ensureAttribute(element, name, type, notes) {
  var attribute = findByName(element.Attributes, name);
  if (!attribute) {
    attribute = element.Attributes.AddNew(name, type || "");
  }
  attribute.Name = name;
  attribute.Type = type || "";
  attribute.Visibility = "Public";
  if (notes) attribute.Notes = notes;
  attribute.Update();
  return attribute;
}

function ensureDiagram(pkg, name, type, notes) {
  var diagram = findByName(pkg.Diagrams, name);
  if (!diagram) {
    diagram = pkg.Diagrams.AddNew(name, type);
  }
  if (notes) diagram.Notes = notes;
  diagram.Update();
  return diagram;
}

function addToDiagram(diagram, element, left, top, width, height) {
  var geometry = "l=" + left + ";r=" + (left + width) + ";t=" + top + ";b=" + (top + height);
  var object = diagram.DiagramObjects.AddNew(geometry, "");
  object.ElementID = element.ElementID;
  object.Update();
}

function connectRelationship(source, target, rel) {
  var type = rel.type === "Dependency" ? "Dependency" : "Association";
  var connector = source.Connectors.AddNew(rel.label || "", type);
  connector.SupplierID = target.ElementID;
  connector.ClientEnd.Cardinality = rel.fromMultiplicity || "";
  connector.SupplierEnd.Cardinality = rel.toMultiplicity || "";
  if (rel.type === "Composition") connector.ClientEnd.Aggregation = 2;
  if (rel.type === "Aggregation") connector.ClientEnd.Aggregation = 1;
  if (rel.notes) connector.Notes = rel.notes;
  connector.Update();
  return connector;
}

function main() {
  var existing = findByName(Repository.Models, MODEL.rootPackage);
  if (existing) {
    out("Ya existe el paquete '" + MODEL.rootPackage + "'. Elimínalo antes de volver a importar.");
    return;
  }

  var root = Repository.Models.AddNew(MODEL.rootPackage, "");
  root.Notes = MODEL.notes;
  root.Update();

  var elements = {};
  var i;
  var j;

  for (i = 0; i < MODEL.classes.length; i++) {
    var cls = MODEL.classes[i];
    var element = ensureElement(root, cls.name, "Class", cls.notes);
    elements[cls.name] = element;
    for (j = 0; j < cls.attributes.length; j++) {
      ensureAttribute(element, cls.attributes[j].name, cls.attributes[j].type, cls.attributes[j].notes);
    }
  }

  for (i = 0; i < MODEL.relationships.length; i++) {
    var rel = MODEL.relationships[i];
    if (elements[rel.from] && elements[rel.to]) {
      connectRelationship(elements[rel.from], elements[rel.to], rel);
    }
  }

  for (i = 0; i < MODEL.diagrams.length; i++) {
    var spec = MODEL.diagrams[i];
    var diagram = ensureDiagram(root, spec.name, "Logical", spec.description);
    var layout = MODEL.layout || {};
    var columns = layout.columns || 4;
    var x0 = layout.x || 40;
    var y0 = layout.y || 40;
    var gapX = layout.gapX || 300;
    var width = layout.width || 240;
    var rowY = y0;
    var row = 0;

    for (row = 0; row < spec.classes.length; row += columns) {
      var rowClasses = spec.classes.slice(row, row + columns);
      var rowHeight = layout.height || 150;
      var c;
      for (c = 0; c < rowClasses.length; c++) {
        var current = elements[rowClasses[c]];
        var currentHeight = 80 + current.Attributes.Count * 16;
        if (currentHeight < (layout.height || 150)) currentHeight = layout.height || 150;
        if (currentHeight > rowHeight) rowHeight = currentHeight;
      }
      for (c = 0; c < rowClasses.length; c++) {
        var item = elements[rowClasses[c]];
        var itemHeight = 80 + item.Attributes.Count * 16;
        if (itemHeight < (layout.height || 150)) itemHeight = layout.height || 150;
        addToDiagram(diagram, item, x0 + c * gapX, rowY, width, itemHeight);
      }
      rowY += rowHeight + 40;
    }

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    out("Diagrama '" + spec.name + "' con " + spec.classes.length + " clases.");
  }

  out("Diseño de datos importado con " + MODEL.classes.length + " clases, " + MODEL.relationships.length + " relaciones y " + MODEL.diagrams.length + " diagramas.");
}

try {
  main();
} catch (e) {
  out("ERROR: " + (e && e.message ? e.message : e));
}
`;

const header = `// ARCHIVO GENERADO POR docs/sdd/ea/generar-diseno-datos.mjs
// No editar a mano. Modifica modelo.json y diseno-datos.json, y vuelve a ejecutar el generador.
// Ejecutar en Enterprise Architect: Develop > Scripting > crear script JScript.
// Crea el paquete "${design.rootPackage}" y aborta si ya existe.
`;

const output = `${header}\nvar MODEL = ${JSON.stringify(payload, null, 2)};\n${runtime}`;
fs.writeFileSync(outPath, output, "utf8");
console.log(`Generado ${path.relative(process.cwd(), outPath)}`);
console.log(
  `clases=${payload.classes.length} relaciones=${payload.relationships.length} diagramas=${payload.diagrams.length}`
);
