import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CheckFileIdGuard implements CanActivate {
    constructor() {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const data = context.switchToWs().getData();
        const fileId = JSON.parse(data).file_id;
        return fileId && [1, 2, 3].includes(fileId);
    }
}
