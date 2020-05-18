import { Injectable, HttpService } from '@nestjs/common';

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

    await this.http.post(requestUrl, dummyData).toPromise();

    return sessionId;
  }

  async getSessionQuestions(sessionId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    let questions;
    await this.http.get(requestUrl).toPromise().then(res => {
      questions = res.data;
    });

    let mappedQuestions = new Map(Object.entries(questions));
    mappedQuestions.delete('dummy');

    let filteredQuestion = {};
    mappedQuestions.forEach((v, k) => {
      filteredQuestion[k] = v;
    })

    filteredQuestion = JSON.parse(JSON.stringify(filteredQuestion));
    return filteredQuestion;
  }

  async addQuestion(sessionId: String, question: String, userId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('.json');

    if (question == null) {
      throw Error('The question cannot be empty.');
    }

    if (question.length > 150 || question.length < 20) {
      throw Error('The question needs between 20 and 150 characters.');
    }

    if (!question.includes('?')) {
      throw Error('The question has to end with a \'?\'');
    }

    let newQuestion = {
      'question': question,
      'upVotes': 1,
      'userId': userId,
      'likers': [userId]
    };

    let questionId;
    await this.http.post(requestUrl, newQuestion).toPromise().then(res => {
      questionId = res.data['name'];
    });

    return questionId;
  }

  async deleteQuestion(sessionId: String, questionId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    await this.http.delete(requestUrl).toPromise();
  }

  async upVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;
    await this.http.get(requestUrl).toPromise().then((res) => {
      currentUpVote = res.data['upVotes'];
      currentLikers = res.data['likers'];
    });

    if (currentLikers.includes(userId)) {
      throw Error('This user already liked this question.');
    }

    currentLikers.push(userId);
    let upVotedQuestion = {
      'upVotes': currentUpVote + 1,
      'likers': currentLikers,
    };

    await this.http.patch(requestUrl, upVotedQuestion).toPromise();
  }

  async downVote(sessionId: String, questionId: String, userId: String): Promise<any> {
    let requestUrl = this.baseUrl.concat(sessionId.toString());
    requestUrl = requestUrl.concat('/').concat(questionId.toString());
    requestUrl = requestUrl.concat('.json');

    let currentUpVote: number;
    let currentLikers: any;
    let askerId: String;
    await this.http.get(requestUrl).toPromise().then((res) => {
      currentUpVote = res.data['upVotes'];
      currentLikers = res.data['likers'];
      askerId = res.data['userId']
    });

    if (!currentLikers.includes(userId)) {
      throw Error('This user never liked this question.');
    }

    if (userId === askerId) {
      throw Error('You can\'t downvote your own question.');
    }

    currentLikers.splice(currentLikers.indexOf(userId), 1);
    let upVotedQuestion = {
      'upVotes': currentUpVote - 1,
      'likers': currentLikers,
    };

    await this.http.patch(requestUrl, upVotedQuestion).toPromise();
  }
}
