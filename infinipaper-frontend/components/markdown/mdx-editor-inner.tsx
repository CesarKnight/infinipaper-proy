"use client";

import "@mdxeditor/editor/style.css";
import { cn } from "cn";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  StrikeThroughSupSubToggles,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type Translation,
} from "@mdxeditor/editor";

export interface MdxEditorInnerProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** Hace que el editor llene la altura del contenedor y desplace su contenido internamente. */
  fill?: boolean;
}

const CODE_BLOCK_LANGUAGES: Record<string, string> = {
  "": "Texto plano",
  txt: "Texto plano",
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  json: "JSON",
  bash: "Bash",
  python: "Python",
  sql: "SQL",
  md: "Markdown",
};

/**
 * Traducciones de presentación de MDXEditor. No afectan al Markdown generado.
 * Se cubren los controles de la toolbar y los diálogos de enlace, imagen y tabla.
 */
const EDITOR_TRANSLATIONS: Record<string, string> = {
  "toolbar.toggleGroup": "Grupo de herramientas",
  "toolbar.blockTypeSelect.selectBlockTypeTooltip": "Seleccionar tipo de bloque",
  "toolbar.blockTypeSelect.placeholder": "Tipo de bloque",
  "toolbar.blockTypes.paragraph": "Párrafo",
  "toolbar.blockTypes.quote": "Cita",
  "toolbar.blockTypes.heading": "Encabezado {{level}}",
  "toolbar.bold": "Negrita",
  "toolbar.removeBold": "Quitar negrita",
  "toolbar.italic": "Cursiva",
  "toolbar.removeItalic": "Quitar cursiva",
  "toolbar.underline": "Subrayado",
  "toolbar.removeUnderline": "Quitar subrayado",
  "toolbar.strikethrough": "Tachado",
  "toolbar.removeStrikethrough": "Quitar tachado",
  "toolbar.superscript": "Superíndice",
  "toolbar.removeSuperscript": "Quitar superíndice",
  "toolbar.subscript": "Subíndice",
  "toolbar.removeSubscript": "Quitar subíndice",
  "toolbar.inlineCode": "Código en línea",
  "toolbar.removeInlineCode": "Quitar código en línea",
  "toolbar.highlight": "Resaltar",
  "toolbar.removeHighlight": "Quitar resaltado",
  "toolbar.bulletedList": "Lista con viñetas",
  "toolbar.numberedList": "Lista numerada",
  "toolbar.checkList": "Lista de tareas",
  "toolbar.link": "Insertar enlace",
  "toolbar.image": "Insertar imagen",
  "toolbar.table": "Insertar tabla",
  "toolbar.thematicBreak": "Insertar separador",
  "toolbar.codeBlock": "Insertar bloque de código",
  "toolbar.richText": "Redactar",
  "toolbar.source": "Markdown",
  "toolbar.diffMode": "Diferencias",
  "toolbar.undo": "Deshacer ({{shortcut}})",
  "toolbar.redo": "Rehacer ({{shortcut}})",
  "contentArea.editableMarkdown": "contenido Markdown editable",
  "codeBlock.language": "Lenguaje del bloque",
  "codeBlock.inlineLanguage": "Lenguaje",
  "codeBlock.selectLanguage": "Seleccionar lenguaje del bloque",
  "createLink.url": "URL",
  "createLink.urlPlaceholder": "Selecciona o pega una URL",
  "createLink.text": "Texto del enlace",
  "createLink.textTooltip": "Texto que se mostrará en el enlace",
  "createLink.title": "Título del enlace",
  "createLink.titleTooltip": "Atributo title del enlace, visible al pasar el cursor",
  "createLink.saveTooltip": "Aplicar URL",
  "createLink.cancelTooltip": "Cancelar cambio",
  "linkPreview.edit": "Editar URL del enlace",
  "linkPreview.remove": "Quitar enlace",
  "linkPreview.copyToClipboard": "Copiar al portapapeles",
  "linkPreview.copied": "¡Copiado!",
  "uploadImage.dialogTitle": "Insertar imagen",
  "uploadImage.dialogDescription":
    "Inserta una imagen desde una URL o sube una desde tu dispositivo.",
  "uploadImage.dialogDescriptionNoUpload": "Inserta una imagen desde una URL.",
  "uploadImage.uploadInstructions": "Sube una imagen desde tu dispositivo:",
  "uploadImage.addViaUrlInstructions": "O añade una imagen desde una URL:",
  "uploadImage.addViaUrlInstructionsNoUpload": "Añade una imagen desde una URL:",
  "uploadImage.autoCompletePlaceholder": "Selecciona o pega la URL de la imagen",
  "uploadImage.alt": "Texto alternativo:",
  "uploadImage.title": "Título:",
  "uploadImage.width": "Ancho:",
  "uploadImage.height": "Alto:",
  "imageEditor.editImage": "Editar imagen",
  "imageEditor.deleteImage": "Eliminar imagen",
  "table.columnMenu": "Menú de columna",
  "table.rowMenu": "Menú de fila",
  "table.textAlignment": "Alineación del texto",
  "table.alignLeft": "Alinear a la izquierda",
  "table.alignCenter": "Centrar",
  "table.alignRight": "Alinear a la derecha",
  "table.insertColumnLeft": "Insertar columna a la izquierda",
  "table.insertColumnRight": "Insertar columna a la derecha",
  "table.deleteColumn": "Eliminar esta columna",
  "table.insertRowAbove": "Insertar fila arriba",
  "table.insertRowBelow": "Insertar fila abajo",
  "table.deleteRow": "Eliminar esta fila",
  "table.deleteTable": "Eliminar tabla",
  "dialogControls.save": "Guardar",
  "dialogControls.cancel": "Cancelar",
};

function interpolate(
  message: string,
  values?: Record<string, unknown>,
): string {
  if (!values) return message;
  return Object.entries(values).reduce(
    (result, [name, value]) =>
      result.split(`{{${name}}}`).join(String(value)),
    message,
  );
}

const SPANISH_TRANSLATION: Translation = (
  key,
  defaultValue,
  interpolations,
) =>
  interpolate(EDITOR_TRANSLATIONS[key] ?? defaultValue, interpolations);

export default function MdxEditorInner({
  markdown,
  onChange,
  readOnly,
  placeholder,
  fill,
}: MdxEditorInnerProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      translation={SPANISH_TRANSLATION}
      className={cn(
        "mdx-editor rounded-lg border bg-card",
        fill && "mdxeditor-full-height h-full",
      )}
      contentEditableClassName="mdx-content"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        imagePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
        codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
        diffSourcePlugin({ viewMode: "rich-text" }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper
              options={["rich-text", "source"]}
              SourceToolbar={
                <div
                  className="mdx-toolbar-group"
                  role="group"
                  aria-label="Historial"
                >
                  <UndoRedo />
                </div>
              }
            >
              <div
                className="mdx-toolbar-group"
                role="group"
                aria-label="Historial"
              >
                <UndoRedo />
              </div>
              <div
                className="mdx-toolbar-group"
                role="group"
                aria-label="Tipo de bloque"
              >
                <BlockTypeSelect />
              </div>
              <div
                className="mdx-toolbar-group"
                role="group"
                aria-label="Formato de texto"
              >
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles />
                <CodeToggle />
              </div>
              <div
                className="mdx-toolbar-group"
                role="group"
                aria-label="Listas"
              >
                <ListsToggle />
              </div>
              <div
                className="mdx-toolbar-group"
                role="group"
                aria-label="Insertar contenido"
              >
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
              </div>
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
}
