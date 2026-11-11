#!/usr/bin/env node
/**
 * Genera el script de automatización de Enterprise Architect a partir de
 * `modelo.json`. El script resultante se ejecuta desde la ventana de
 * Scripting de EA (JScript) y crea paquetes, elementos y diagramas.
 *
 * Uso: node docs/sdd/ea/generar.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(here, "modelo.json");
const outPath = path.join(here, "importar-modelo.js");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

function fail(message) {
  console.error(`Error de modelo: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------
// Validación del modelo
// ---------------------------------------------------------------
const actorNames = new Set();
for (const actor of model.actors) {
  if (!actor.name) fail("actor sin nombre");
  if (actorNames.has(actor.name)) fail(`actor duplicado: ${actor.name}`);
  actorNames.add(actor.name);
}

const useCaseIds = new Set();
for (const uc of model.useCases) {
  if (!uc.id || !uc.name) fail("caso de uso sin id o nombre");
  if (useCaseIds.has(uc.id)) fail(`caso de uso duplicado: ${uc.id}`);
  useCaseIds.add(uc.id);
  for (const actor of uc.actors ?? []) {
    if (!actorNames.has(actor)) fail(`${uc.id} referencia un actor inexistente: ${actor}`);
  }
}

const packagePaths = new Set();
function walkPackages(node, prefix) {
  const current = prefix ? `${prefix}/${node.name}` : node.name;
  if (packagePaths.has(current)) fail(`paquete duplicado: ${current}`);
  packagePaths.add(current);
  for (const child of node.children ?? []) walkPackages(child, current);
}
walkPackages(model.packageModel, "");

for (const dep of model.packageDependencies ?? []) {
  if (!packagePaths.has(dep.from)) fail(`dependencia desde un paquete inexistente: ${dep.from}`);
  if (!packagePaths.has(dep.to)) fail(`dependencia hacia un paquete inexistente: ${dep.to}`);
}

for (const [key, diagram] of Object.entries(model.c4)) {
  const names = new Set();
  for (const element of diagram.elements) {
    if (names.has(element.name)) fail(`elemento C4 duplicado en ${key}: ${element.name}`);
    names.add(element.name);
  }
  for (const rel of diagram.relationships) {
    if (!names.has(rel.from)) fail(`relación C4 ${key} desde un elemento inexistente: ${rel.from}`);
    if (!names.has(rel.to)) fail(`relación C4 ${key} hacia un elemento inexistente: ${rel.to}`);
  }
}

const sequenceIds = new Set();
for (const seq of model.sequenceDiagrams) {
  if (sequenceIds.has(seq.id)) fail(`secuencia duplicada: ${seq.id}`);
  sequenceIds.add(seq.id);
  const aliases = new Set();
  for (const participant of seq.participants) {
    if (aliases.has(participant.alias)) fail(`alias duplicado en ${seq.id}: ${participant.alias}`);
    aliases.add(participant.alias);
  }
  for (const message of seq.messages) {
    if (!aliases.has(message.from)) fail(`mensaje ${seq.id} desde alias inexistente: ${message.from}`);
    if (!aliases.has(message.to)) fail(`mensaje ${seq.id} hacia alias inexistente: ${message.to}`);
  }
}

const classNames = new Set();
for (const cls of model.classModel.classes) {
  if (classNames.has(cls.name)) fail(`clase duplicada: ${cls.name}`);
  classNames.add(cls.name);
}
for (const en of model.classModel.enums) {
  if (classNames.has(en.name)) fail(`enum duplicado: ${en.name}`);
  classNames.add(en.name);
}
for (const rel of model.classModel.relations) {
  if (!classNames.has(rel.from)) fail(`relación de clase desde un elemento inexistente: ${rel.from}`);
  if (!classNames.has(rel.to)) fail(`relación de clase hacia un elemento inexistente: ${rel.to}`);
}

// ---------------------------------------------------------------
// Runtime JScript para Enterprise Architect
// ---------------------------------------------------------------
const runtime = String.raw`
function out(message) {
  if (typeof Session !== "undefined" && Session.Output) {
    Session.Output("[SDD] " + message);
  }
}

function findByName(collection, name) {
  try {
    return collection.GetByName(name);
  } catch (e) {
    return null;
  }
}

function ensurePackage(parent, name, notes) {
  var pkg = findByName(parent.Packages, name);
  if (!pkg) {
    pkg = parent.Packages.AddNew(name, "");
  }
  if (notes) pkg.Notes = notes;
  pkg.Update();
  return pkg;
}

function ensureElement(pkg, name, type, stereotype, notes) {
  var element = findByName(pkg.Elements, name);
  if (!element) {
    element = pkg.Elements.AddNew(name, type);
  }
  if (stereotype) element.Stereotype = stereotype;
  if (notes) element.Notes = notes;
  element.Update();
  return element;
}

function ensureAttribute(element, name, type, notes) {
  var attribute = findByName(element.Attributes, name);
  if (!attribute) {
    attribute = element.Attributes.AddNew(name, type || "");
  }
  if (type) attribute.Type = type;
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
  var right = left + width;
  var bottom = top + height;
  var geometry = "l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom;
  var object = diagram.DiagramObjects.AddNew(geometry, "");
  object.ElementID = element.ElementID;
  object.Update();
}

function connect(source, target, type, name, notes) {
  var connector = source.Connectors.AddNew(name || "", type);
  connector.SupplierID = target.ElementID;
  if (notes) connector.Notes = notes;
  connector.Update();
  return connector;
}

function connectSequence(source, target, name, notes, sequenceNo) {
  var connector = connect(source, target, "Sequence", name, notes);
  connector.SequenceNo = sequenceNo;
  connector.Update();
  return connector;
}

function createUseCaseModel(root) {
  var pkg = ensurePackage(root, MODEL.diagramPackages.useCases, "Actores y casos de uso de Infinipaper.");
  var actors = {};
  var useCases = {};
  var i;
  var j;

  for (i = 0; i < MODEL.actors.length; i++) {
    var actor = MODEL.actors[i];
    actors[actor.name] = ensureElement(pkg, actor.name, "Actor", "actor", actor.notes);
  }

  for (i = 0; i < MODEL.useCases.length; i++) {
    var uc = MODEL.useCases[i];
    useCases[uc.id] = ensureElement(pkg, uc.id + " · " + uc.name, "UseCase", "usecase", uc.notes);
  }

  var diagram = ensureDiagram(pkg, "Casos de uso · Infinipaper", "Use Case", "Cada caso de uso corresponde a una spec SDD.");

  for (i = 0; i < MODEL.actors.length; i++) {
    addToDiagram(diagram, actors[MODEL.actors[i].name], 40, 40 + i * 90, 130, 60);
  }
  for (i = 0; i < MODEL.useCases.length; i++) {
    addToDiagram(diagram, useCases[MODEL.useCases[i].id], 320, 40 + i * 72, 260, 55);
  }
  for (i = 0; i < MODEL.useCases.length; i++) {
    var current = MODEL.useCases[i];
    for (j = 0; j < current.actors.length; j++) {
      var linkedActor = actors[current.actors[j]];
      if (linkedActor) {
        connect(linkedActor, useCases[current.id], "UseCase", "", "Asociación de caso de uso");
      }
    }
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Casos de uso: " + MODEL.useCases.length + " casos, " + MODEL.actors.length + " actores.");
}

function createPackageChildren(parent, children, parentPath, map) {
  if (!children) return;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var childPath = parentPath + "/" + child.name;
    var pkg = ensurePackage(parent, child.name, child.notes);
    map[childPath] = pkg;
    if (child.children) createPackageChildren(pkg, child.children, childPath, map);
  }
}

function createPackageModel(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.packages, "Paquetes del repositorio y dependencias.");
  var rootPkg = ensurePackage(base, MODEL.packageModel.name, MODEL.packageModel.notes);
  var map = {};
  map[MODEL.packageModel.name] = rootPkg;
  createPackageChildren(rootPkg, MODEL.packageModel.children, MODEL.packageModel.name, map);

  var diagram = ensureDiagram(base, "Paquetes · Infinipaper", "Logical", "Vista de paquetes y dependencias.");
  var index = 0;
  for (var key in map) {
    if (!map.hasOwnProperty(key)) continue;
    if (key === MODEL.packageModel.name) continue;
    addToDiagram(diagram, map[key].Element, 40 + (index % 3) * 300, 40 + Math.floor(index / 3) * 140, 240, 90);
    index++;
  }
  for (var i = 0; i < MODEL.packageDependencies.length; i++) {
    var dep = MODEL.packageDependencies[i];
    var from = map[dep.from];
    var to = map[dep.to];
    if (from && to) connect(from.Element, to.Element, "Dependency", dep.label, dep.notes);
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Paquetes: " + index + " paquetes y " + MODEL.packageDependencies.length + " dependencias.");
}

function createC4Model(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.c4, "Arquitectura C4 de Infinipaper.");
  var keys = ["context", "containers", "components"];
  for (var k = 0; k < keys.length; k++) {
    var cfg = MODEL.c4[keys[k]];
    var elements = {};
    var i;
    for (i = 0; i < cfg.elements.length; i++) {
      var e = cfg.elements[i];
      elements[e.name] = ensureElement(base, e.name, e.type, e.stereotype, e.notes);
    }
    var diagram = ensureDiagram(base, cfg.name, "Component", "Vista C4 generada desde modelo.json.");
    for (i = 0; i < cfg.elements.length; i++) {
      addToDiagram(diagram, elements[cfg.elements[i].name], 40 + (i % 3) * 300, 40 + Math.floor(i / 3) * 120, 230, 80);
    }
    for (i = 0; i < cfg.relationships.length; i++) {
      var rel = cfg.relationships[i];
      if (elements[rel.from] && elements[rel.to]) {
        connect(elements[rel.from], elements[rel.to], "Dependency", rel.label, rel.notes);
      }
    }
    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
  }
  out("C4: contexto, contenedores y componentes.");
}

function createClassModel(root) {
  var pkg = ensurePackage(root, MODEL.diagramPackages.classes, "Modelo de dominio y clases de implementación.");
  var elements = {};
  var i;
  var j;

  for (i = 0; i < MODEL.classModel.classes.length; i++) {
    var cls = MODEL.classModel.classes[i];
    var element = ensureElement(pkg, cls.name, "Class", cls.stereotype || "entity", cls.notes);
    elements[cls.name] = element;
    for (j = 0; j < cls.attributes.length; j++) {
      var attribute = cls.attributes[j];
      ensureAttribute(element, attribute.name, attribute.type, attribute.notes);
    }
  }

  for (i = 0; i < MODEL.classModel.enums.length; i++) {
    var enumDef = MODEL.classModel.enums[i];
    var enumElement = ensureElement(pkg, enumDef.name, "Enumeration", "enumeration", enumDef.notes);
    elements[enumDef.name] = enumElement;
    for (j = 0; j < enumDef.values.length; j++) {
      ensureAttribute(enumElement, enumDef.values[j], "", "");
    }
  }

  var diagram = ensureDiagram(pkg, MODEL.classModel.name, "Logical", "Diagrama de clases del modelo de dominio.");
  var index = 0;
  for (var key in elements) {
    if (!elements.hasOwnProperty(key)) continue;
    addToDiagram(diagram, elements[key], 40 + (index % 4) * 260, 40 + Math.floor(index / 4) * 180, 220, 140);
    index++;
  }

  for (i = 0; i < MODEL.classModel.relations.length; i++) {
    var rel = MODEL.classModel.relations[i];
    if (!elements[rel.from] || !elements[rel.to]) continue;
    var connector = connect(
      elements[rel.from],
      elements[rel.to],
      rel.type === "Dependency" ? "Dependency" : "Association",
      rel.label,
      rel.notes
    );
    if (rel.type !== "Dependency") {
      connector.ClientEnd.Cardinality = rel.fromMultiplicity || "";
      connector.SupplierEnd.Cardinality = rel.toMultiplicity || "";
      if (rel.type === "Composition") connector.ClientEnd.Aggregation = 2;
      if (rel.type === "Aggregation") connector.ClientEnd.Aggregation = 1;
      connector.Update();
    }
  }

  diagram.Update();
  Repository.ReloadDiagram(diagram.DiagramID);
  out("Clases: " + MODEL.classModel.classes.length + " clases, " + MODEL.classModel.enums.length + " enums.");
}

function createSequenceModel(root) {
  var base = ensurePackage(root, MODEL.diagramPackages.sequences, "Un diagrama de secuencia por spec.");
  for (var s = 0; s < MODEL.sequenceDiagrams.length; s++) {
    var seq = MODEL.sequenceDiagrams[s];
    var diagram = ensureDiagram(base, seq.name, "Sequence", "Secuencia de la spec " + seq.id + ".");
    var map = {};
    var i;
    for (i = 0; i < seq.participants.length; i++) {
      var participant = seq.participants[i];
      map[participant.alias] = ensureElement(
        base,
        seq.id + " · " + participant.name,
        participant.type || "Object",
        "",
        participant.notes
      );
      addToDiagram(diagram, map[participant.alias], 40 + i * 170, 40, 130, 55);
    }
    for (i = 0; i < seq.messages.length; i++) {
      var message = seq.messages[i];
      if (map[message.from] && map[message.to]) {
        connectSequence(map[message.from], map[message.to], message.name, message.notes, i + 1);
      }
    }
    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
  }
  out("Secuencias: " + MODEL.sequenceDiagrams.length + " diagramas.");
}

function main() {
  var existing = findByName(Repository.Models, MODEL.rootPackage);
  if (existing) {
    out("Ya existe el paquete raíz '" + MODEL.rootPackage + "'. Elimínalo antes de volver a importar.");
    return;
  }

  var root = Repository.Models.AddNew(MODEL.rootPackage, "");
  root.Update();

  createUseCaseModel(root);
  createPackageModel(root);
  createC4Model(root);
  createClassModel(root);
  createSequenceModel(root);

  out("Modelo importado correctamente en '" + MODEL.rootPackage + "'.");
}

try {
  main();
} catch (e) {
  out("ERROR: " + (e && e.message ? e.message : e));
}
`;

const header = `// ARCHIVO GENERADO POR docs/sdd/ea/generar.mjs
// No editar a mano. Modifica modelo.json y vuelve a ejecutar el generador.
// Ejecutar en Enterprise Architect: Develop > Scripting > crear script JScript.
// El script crea el paquete raíz "${model.rootPackage}" y aborta si ya existe.
`;

const output = `${header}\nvar MODEL = ${JSON.stringify(model, null, 2)};\n${runtime}`;
fs.writeFileSync(outPath, output, "utf8");
console.log(`Generado ${path.relative(process.cwd(), outPath)}`);
console.log(
  `actores=${model.actors.length} casos=${model.useCases.length} secuencias=${model.sequenceDiagrams.length}`
);
