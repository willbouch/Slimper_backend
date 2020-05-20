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
      throw error;
    }

    return sessionId;
  }

  async getSessionQuestions(sessionId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    let questions;
    try {
      await this.http.get(requestUrl).toPromise().then(res => {
        questions = res.data;
      });
    } catch (error) {
      throw error;
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
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    if (question == null) {
      throw new HttpException('The question cannot be empty.', 500);
    }

    if (question.length > 150 || question.length < 20) {
      throw new HttpException('The question needs between 20 and 150 characters.', 500);
    }

    if (!question.includes('?')) {
      throw new HttpException('The question has to end with a \'?\'', 500);
    }

    let newQuestion = {
      'question': question,
      'upVotes': 1,
      'userId': userId,
      'likers': [userId]
    };

    let questionId;

    try {
      await this.http.post(requestUrl, newQuestion).toPromise().then(res => {
        questionId = res.data['name'];
      });
    } catch (error) {
      throw error;
    }

    return questionId;
  }

  async deleteQuestion(sessionId: String, questionId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    try {
      await this.http.delete(requestUrl).toPromise();
    } catch (error) {
      throw error;
    }
  }

  async upVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;

    try {
      await this.http.get(requestUrl).toPromise().then((res) => {
        currentUpVote = res.data['upVotes'];
        currentLikers = res.data['likers'];
      });
    } catch (error) {
      throw error;
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
      throw error;
    }
  }

  async downVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;
    let askerId: String;

    try {
      await this.http.get(requestUrl).toPromise().then((res) => {
        currentUpVote = res.data['upVotes'];
        currentLikers = res.data['likers'];
        askerId = res.data['userId']
      });
    } catch (error) {
      throw error;
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
      throw error;
    }
  }
}
