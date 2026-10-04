/** Archivo subido vía Multer (memoryStorage). Estructuralmente compatible con Express.Multer.File. */
export interface UploadedFileData {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
