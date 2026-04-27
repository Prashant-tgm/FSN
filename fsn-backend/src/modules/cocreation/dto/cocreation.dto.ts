import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsOptional, IsString,
  IsEnum, IsBoolean, IsArray,
} from 'class-validator';
import { CoCreationStatus } from '../../../common/enums';

export class RequestCoCreationDto {
  @ApiProperty({ description: 'Problem UUID' })
  @IsUUID()
  problemId: string;

  @ApiPropertyOptional({ description: 'Solution UUID (if already submitted)' })
  @IsOptional()
  @IsUUID()
  solutionId?: string;
}

export class UpdateCoCreationStatusDto {
  @ApiProperty({ enum: CoCreationStatus })
  @IsEnum(CoCreationStatus)
  status: CoCreationStatus;
}

export class WorkspaceTaskDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dueDate?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [WorkspaceTaskDto] })
  @IsOptional() @IsArray()
  tasks?: WorkspaceTaskDto[];
}

export class AddNgoFacilitatorDto {
  @ApiProperty({ description: 'NGO user UUID to add as facilitator' })
  @IsUUID()
  ngoUserId: string;
}
