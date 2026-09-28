import { IsNotEmpty } from 'class-validator';

export class ChannelUploadDto {
  @IsNotEmpty({ message: 'Channel id cannot be empty' })
  id: string;
}
