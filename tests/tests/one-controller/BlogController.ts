import "reflect-metadata";
import { Get, JsonController } from "routing-controllers";

@JsonController('/blog', {})
export class BlogController {
  @Get('/titles')
  async getTitles(): Promise<string[]> {
    return []
  }
}
