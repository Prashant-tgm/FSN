import {
  Controller, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

class GetUploadUrlDto {
  @IsString() contentType: string;
  @IsIn(['problems','solutions','profiles','blogs','cocreation']) folder: any;
}

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get S3 pre-signed POST URL for direct browser upload' })
  getUploadUrl(@CurrentUser() user: JwtPayload, @Body() dto: GetUploadUrlDto) {
    return this.mediaService.getPresignedUploadUrl(user.sub, dto.contentType, dto.folder);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete own media file from S3' })
  deleteMedia(@Param('key') key: string, @CurrentUser() user: JwtPayload) {
    return this.mediaService.deleteMedia(decodeURIComponent(key), user.sub);
  }
}