import { MainService } from '../../../services/MainService';
import { TestingModule, Test } from '@nestjs/testing';
import { HttpService, HttpModule, INestApplication, HttpException } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios'

describe('MainService', () => {
    let app: INestApplication;
    let mainService: MainService;
    let httpService: HttpService;

    beforeAll(async () => {
        const testAppModule: TestingModule = await Test.createTestingModule({
            imports: [AppModule, HttpModule],
            providers: [MainService],
        }).compile();

        app = testAppModule.createNestApplication();
        httpService = testAppModule.get<HttpService>(HttpService);
        mainService = testAppModule.get<MainService>(MainService);
        await app.init();
    });

    describe('createSession', () => {
        it('should successfully create a session', async () => {
            const requestResult: AxiosResponse = {
                data: {},
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'post').mockImplementation(() => of(requestResult));
            const sessionId = await mainService.createSession();
            expect(sessionId).toHaveLength(6);
            expect(sessionId).toMatch(new RegExp('[A-Z0-9]{6}'));
        });

        it('should throw error if problem with the post request', async () => {
            jest.spyOn(httpService, 'post').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.createSession()).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('getSessionQuestions', () => {
        const requestResult: AxiosResponse = {
            data: {
                '-M7_9auLxjfa0p5V5syS':
                {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                '-M7jwsRjjkWdk5zvA4NY':
                {
                    likers: ['1'],
                    question: 'This is another question for a test ?',
                    upVotes: 1,
                    userId: '1'
                },
                dummy: { '-M7_SlxoweonWRIRmriY': { dummy: 'dummy' } }
            },
            status: 200,
            statusText: '',
            headers: {},
            config: {}
        };

        const expectedResult: any = {
            '-M7_9auLxjfa0p5V5syS':
            {
                likers: ['1', '2'],
                question: 'This is a question for a test ?',
                upVotes: 2,
                userId: '1'
            },
            '-M7jwsRjjkWdk5zvA4NY':
            {
                likers: ['1'],
                question: 'This is another question for a test ?',
                upVotes: 1,
                userId: '1'
            },
        }

        it('should succesfully retrieve the questions of a session', async () => {
            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            const questions = await mainService.getSessionQuestions('X8X8X8');
            expect(questions).toEqual(expectedResult);
        });

        it('should throw error if problem with the get request', async () => {
            jest.spyOn(httpService, 'get').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.getSessionQuestions('X8X8X8')).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('addQuestion', () => {
        let validQuestion: String = 'Here is a valid question ?';
        let validSessionId: String = 'X8X8X8';
        let validUserId: String = '1'

        it('should successfully add a question to a session', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    name: '-M7twpERpQ8SKE7qZ3DD'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'post').mockImplementation(() => of(requestResult));
            const questionId = await mainService.addQuestion(validSessionId, validQuestion, validUserId);
            expect(questionId).toEqual('-M7twpERpQ8SKE7qZ3DD');
        });

        it('should throw error if question is null', async () => {
            await expect(mainService.addQuestion(validSessionId, null, validUserId)).rejects.toThrowError('The question cannot be empty.');
        });

        it('should throw error if question is empty', async () => {
            await expect(mainService.addQuestion(validSessionId, '', validUserId)).rejects.toThrow();
        });

        it('should throw error if question is less than 20 characters long', async () => {
            await expect(mainService.addQuestion(validSessionId, 'too short', validUserId)).rejects.toThrowError('The question needs between 20 and 150 characters.');
        });

        it('should throw error if question is more than 150 characters long', async () => {
            await expect(mainService.addQuestion(validSessionId, Math.random().toString(36).substring(0, 160), validUserId)).rejects.toThrowError('The question needs between 20 and 150 characters.');
        });

        it('should throw error if question has no question mark', async () => {
            await expect(mainService.addQuestion(validSessionId, validQuestion.slice(0, -1), validUserId)).rejects.toThrowError('The question has to end with a \'?\'.');
        });

        it('should throw error if userId is null', async () => {
            await expect(mainService.addQuestion(validSessionId, validQuestion, null)).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if userId is empty', async () => {
            await expect(mainService.addQuestion(validSessionId, validQuestion, '')).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if problem with the post request', async () => {
            jest.spyOn(httpService, 'post').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.addQuestion(validSessionId, validQuestion, validUserId)).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('deleteQuestion', () => {
        let validSessionId: String = 'X8X8X8';

        it('should throw error if questionId is null', async () => {
            await expect(mainService.deleteQuestion(validSessionId, null)).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if questionId is empty', async () => {
            await expect(mainService.deleteQuestion(validSessionId, '')).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if problem with the delete request', async () => {
            jest.spyOn(httpService, 'delete').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.deleteQuestion(validSessionId, 'Some id')).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('upVote', () => {
        let validSessionId: String = 'X8X8X8';
        let validUserId: String = '3'
        let validQuestionId: String = 'Some id';

        it('should successfully upvote a question', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            const didWork = await mainService.upVote(validSessionId, validQuestionId, validUserId);
            expect(didWork).toEqual(true);
        });

        it('should throw error if questionId is null', async () => {
            await expect(mainService.upVote(validSessionId, null, validUserId)).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if questionId is empty', async () => {
            await expect(mainService.upVote(validSessionId, '', validUserId)).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if userId is null', async () => {
            await expect(mainService.upVote(validSessionId, validQuestionId, null)).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if userId is empty', async () => {
            await expect(mainService.upVote(validSessionId, validQuestionId, '')).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if problem with the get request', async () => {
            jest.spyOn(httpService, 'get').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.upVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('Error while accessing the database.');
        });

        it('should throw error if user already upvoted', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '3'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            await expect(mainService.upVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('This user already liked this question.');
        });

        it('should throw error if problem with the patch request', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            jest.spyOn(httpService, 'patch').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.upVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('downVote', () => {
        let validSessionId: String = 'X8X8X8';
        let validUserId: String = '2'
        let validQuestionId: String = 'Some id';

        it('should successfully downVote a question', async () => {
            const getRequestResult: AxiosResponse = {
                data: {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            const pathRequestResult: AxiosResponse = {
                data: {},
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(getRequestResult));
            jest.spyOn(httpService, 'patch').mockImplementation(() => of(pathRequestResult));
            const didWork = await mainService.downVote(validSessionId, validQuestionId, validUserId);
            expect(didWork).toEqual(true);
        });

        it('should throw error if questionId is null', async () => {
            await expect(mainService.downVote(validSessionId, null, validUserId)).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if questionId is empty', async () => {
            await expect(mainService.downVote(validSessionId, '', validUserId)).rejects.toThrowError('The question cannot have an empty id.');
        });

        it('should throw error if userId is null', async () => {
            await expect(mainService.downVote(validSessionId, validQuestionId, null)).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if userId is empty', async () => {
            await expect(mainService.downVote(validSessionId, validQuestionId, '')).rejects.toThrowError('The user cannot have an empty id.');
        });

        it('should throw error if problem with the get request', async () => {
            jest.spyOn(httpService, 'get').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.downVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('Error while accessing the database.');
        });

        it('should throw error if user never liked the question', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '3'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            await expect(mainService.downVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('This user never liked this question.');
        });

        it('should throw error if user is the one that created the question', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '2'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            await expect(mainService.downVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('You can\'t downvote your own question.');
        });

        it('should throw error if problem with the patch request', async () => {
            const requestResult: AxiosResponse = {
                data: {
                    likers: ['1', '2'],
                    question: 'This is a question for a test ?',
                    upVotes: 2,
                    userId: '1'
                },
                status: 200,
                statusText: '',
                headers: {},
                config: {}
            };

            jest.spyOn(httpService, 'get').mockImplementation(() => of(requestResult));
            jest.spyOn(httpService, 'patch').mockImplementation(() => {
                throw new HttpException('', 500);
            });
            await expect(mainService.downVote(validSessionId, validQuestionId, validUserId)).rejects.toThrowError('Error while accessing the database.');
        });
    });

    describe('performSessionIdChecks', () => {
        it('should throw error if sessionId is null', async () => {
            await expect(mainService.performSessionIdChecks(null)).rejects.toThrowError('The session cannot have an empty id.');
        });

        it('should throw error if sessionId is empty', async () => {
            await expect(mainService.performSessionIdChecks('')).rejects.toThrowError('The session cannot have an empty id.');
        });

        it('should throw error if sessionId is invalid (too short)', async () => {
            await expect(mainService.performSessionIdChecks('ADS')).rejects.toThrowError('The session cannot have an invalid id.');
        });

        it('should throw error if sessionId is invalid (too long)', async () => {
            await expect(mainService.performSessionIdChecks('ADS4234')).rejects.toThrowError('The session cannot have an invalid id.');
        });

        it('should throw error if sessionId is invalid (invalid characters)', async () => {
            await expect(mainService.performSessionIdChecks('_423Ds')).rejects.toThrowError('The session cannot have an invalid id.');
        });
    });
});