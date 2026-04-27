import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class LocationDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) lat?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Rohan Mehta' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Building frugal solutions for rural India.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ example: 'https://cdn.fsnplatform.org/avatars/user.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateNotificationPrefsDto {
  @IsOptional() emailEnabled?: boolean;
  @IsOptional() smsEnabled?: boolean;
  @IsOptional() inAppEnabled?: boolean;
}
