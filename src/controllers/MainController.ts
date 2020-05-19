import { Controller, Get, Param, Post, Body, Delete, Patch } from '@nestjs/common';
import { MainService } from '../services/MainService';

@Controller()
export class MainController {
  constructor(private readonly service: MainService) { }

  @Post('/sessions')
  createSession(): any {
    return this.service.createSession();
  }

  @Get('/questions/:sessionId')
  getSessionQuestions(@Param('sessionId') sessionId: String): any {
    return this.service.getSessionQuestions(sessionId);
  }

  @Post('/questions/:sessionId')
  async addQuestion(@Param('sessionId') sessionId: String,
    @Body('question') question: String,
    @Body('userId') userId: String): Promise<any> {
    return await this.service.addQuestion(sessionId, question, userId);
  }

  @Delete('/questions/:sessionId/:questionId')
  deleteQuestion(@Param('sessionId') sessionId: String,
    @Param('questionId') questionId: String): any {
    this.service.deleteQuestion(sessionId, questionId);
  }

  @Patch('/questions/upvote/:sessionId/:questionId')
  async upVote(@Param('sessionId') sessionId: String,
    @Param('questionId') questionId: String,
    @Body('userId') userId: String): Promise<any> {
    await this.service.upVote(sessionId, questionId, userId);
  }

  @Patch('/questions/downvote/:sessionId/:questionId')
  async downVote(@Param('sessionId') sessionId: String,
    @Param('questionId') questionId: String,
    @Body('userId') userId: String): Promise<any> {
    await this.service.downVote(sessionId, questionId, userId);
  }

}
