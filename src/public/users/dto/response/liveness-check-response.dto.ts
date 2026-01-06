export class LivenessCheckDataDto {
  text: string;
  url: string;
}

export class LivenessCheckResponseDto {
  data: LivenessCheckDataDto;
  next: string | null;
}
