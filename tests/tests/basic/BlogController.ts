import { BodyParam, Get, JsonController, Param, Post, QueryParam } from "routing-controllers";

@JsonController('/blog', {})
export class BlogController {
  @Get('/titles')
  async getTitles(): Promise<string[]> {
    return []
  }

  @Get('/likes')
  async getLikes(
    @QueryParam('title', { type: String }) title: string,
    @QueryParam('max', { type: Number, required: true }) max: number,
    @QueryParam('optional', { type: Number }) optional?: number,
  ): Promise<number> {
    return 1
  }

  @Post('/likes')
  async setLikes(
    @BodyParam('title', { type: String }) title: string,
    @BodyParam('max', { type: Number, required: true }) max: number,
    @BodyParam('optional', { type: Number }) optional?: number,
  ): Promise<number> {
    return 1
  }

  @Get('/posts/:id/date')
  async getDate(
    @Param('id') id: string,
  ): Promise<Date> {
    return new Date()
  }
}
