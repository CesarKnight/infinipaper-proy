import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppException } from '../../common/errors/app.exception.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import type { UploadedFileData } from '../../common/types/uploaded-file.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { SearchUsersDto } from './dto/search-users.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  search(@Query() dto: SearchUsersDto) {
    return this.users.search(dto);
  }

  @Public()
  @Get(':username/avatar')
  async avatar(
    @Param('username') username: string,
    @Res() res: Response,
  ): Promise<void> {
    const object = await this.users.getAvatar(username);
    if (object.contentType) {
      res.setHeader('Content-Type', object.contentType);
    }
    if (object.contentLength) {
      res.setHeader('Content-Length', object.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    object.body.pipe(res);
  }

  @Public()
  @Get(':username')
  profile(@Param('username') username: string) {
    return this.users.getPublicProfile(username);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.users.changePassword(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES } }),
  )
  setAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file?: UploadedFileData,
  ) {
    if (!file) {
      throw new AppException(
        'FILE_REQUIRED',
        'Debes adjuntar una imagen',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      throw new AppException(
        'FILE_UNSUPPORTED_TYPE',
        'Formato de imagen no admitido',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    return this.users.setAvatar(user, file);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@CurrentUser() user: User): Promise<void> {
    await this.users.archive(user.id);
  }
}
