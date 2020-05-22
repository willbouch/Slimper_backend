import { Injectable, HttpService, HttpException } from '@nestjs/common';

@Injectable()
export class MainService {
  baseUrl: String = 'https://slimper-6c9f0.firebaseio.com/';

  constructor(private http: HttpService) { }

  async createSession(): Promise<any> {
    let sessionId: String = Math.random().toString(36).substring(4, 7).toUpperCase() + Math.random().toString(36).substring(4, 7).toUpperCase();
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat('dummy');
    requestUrl = requestUrl.concat('.json');

    let dummyData = {
      'dummy': 'dummy'
    }

    try {
      await this.http.post(requestUrl, dummyData).toPromise();
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    return sessionId;
  }

  async getSessionQuestions(sessionId: String): Promise<any> {
    await this.performSessionIdChecks(sessionId);

    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    let questions;
    try {
      let response = await this.http.get(requestUrl).toPromise();
      questions = response.data;
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    let mappedQuestions = new Map(Object.entries(questions));
    mappedQuestions.delete('dummy');

    let filteredQuestion = {};
    mappedQuestions.forEach((v, k) => {
      filteredQuestion[k] = v;
    });

    filteredQuestion = JSON.parse(JSON.stringify(filteredQuestion));
    return filteredQuestion;
  }

  async addQuestion(sessionId: String, question: String, userId: String): Promise<any> {
    await this.performSessionIdChecks(sessionId);

    if (question == null || question === '') {
      throw new HttpException('The question cannot be empty.', 500);
    }

    if (question.length > 150 || question.length < 20) {
      throw new HttpException('The question needs between 20 and 150 characters.', 500);
    }

    if (!question.includes('?')) {
      throw new HttpException('The question has to end with a \'?\'.', 500);
    }

    if (userId == null || userId === '') {
      throw new HttpException('The user cannot have an empty id.', 500);
    }

    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    let newQuestion = {
      'question': question,
      'upVotes': 1,
      'userId': userId,
      'likers': [userId]
    };

    let questionId: String;
    try {
      let response = await this.http.post(requestUrl, newQuestion).toPromise();
      questionId = response.data['name'];
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    return questionId;
  }

  async deleteQuestion(sessionId: String, questionId: String): Promise<any> {
    await this.performSessionIdChecks(sessionId);

    if (questionId == null || questionId === '') {
      throw new HttpException('The question cannot have an empty id.', 500);
    }

    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    try {
      await this.http.delete(requestUrl).toPromise();
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }
  }

  async upVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    await this.performSessionIdChecks(sessionId);

    if (questionId == null || questionId === '') {
      throw new HttpException('The question cannot have an empty id.', 500);
    }

    if (userId == null || userId === '') {
      throw new HttpException('The user cannot have an empty id.', 500);
    }

    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;
    try {
      let response = await this.http.get(requestUrl).toPromise();
      currentUpVote = response.data['upVotes'];
      currentLikers = response.data['likers'];
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    if (currentLikers.includes(userId)) {
      throw new HttpException('This user already liked this question.', 500);
    }

    currentLikers.push(userId);
    let upVotedQuestion = {
      'upVotes': currentUpVote + 1,
      'likers': currentLikers,
    };

    try {
      await this.http.patch(requestUrl, upVotedQuestion).toPromise();
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    return true;
  }

  async downVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    await this.performSessionIdChecks(sessionId);

    if (questionId == null || questionId === '') {
      throw new HttpException('The question cannot have an empty id.', 500);
    }

    if (userId == null || userId === '') {
      throw new HttpException('The user cannot have an empty id.', 500);
    }

    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;
    let askerId: String;
    try {
      let response = await this.http.get(requestUrl).toPromise();
      currentUpVote = response.data['upVotes'];
      currentLikers = response.data['likers'];
      askerId = response.data['userId']
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    if (!currentLikers.includes(userId)) {
      throw new HttpException('This user never liked this question.', 500);
    }

    if (userId === askerId) {
      throw new HttpException('You can\'t downvote your own question.', 500);
    }

    currentLikers.splice(currentLikers.indexOf(userId), 1);
    let upVotedQuestion = {
      'upVotes': currentUpVote - 1,
      'likers': currentLikers,
    };

    try {
      await this.http.patch(requestUrl, upVotedQuestion).toPromise();
    } catch (error) {
      throw new HttpException('Error while accessing the database.', 500);
    }

    return true;
  }

  async performSessionIdChecks(sessionId: String): Promise<void> {
    if (sessionId == null || sessionId === '') {
      throw new HttpException('The session cannot have an empty id.', 500);
    }

    if (sessionId.match(new RegExp('[A-Z0-9]{6}')) == null || sessionId.length != 6) {
      throw new HttpException('The session cannot have an invalid id.', 500);
    }
  }
}
