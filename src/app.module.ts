import { Module, HttpModule } from '@nestjs/common';
import { MainController } from './controllers/MainController';
import { MainService } from './services/MainService';

@Module({
  imports: [HttpModule],
  controllers: [MainController],
  providers: [MainService],
})
export class AppModule {}
