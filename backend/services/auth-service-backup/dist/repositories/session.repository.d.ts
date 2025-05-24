import { Session } from '@hospital/shared/src/types/user.types';
export declare class SessionRepository {
    private supabase;
    constructor();
    create(sessionData: Session): Promise<Session>;
    findByToken(token: string): Promise<Session | null>;
    findByRefreshToken(refreshToken: string): Promise<Session | null>;
    update(sessionId: string, sessionData: Partial<Session>): Promise<Session | null>;
    deactivateAllUserSessions(userId: string): Promise<void>;
    deleteExpiredSessions(): Promise<void>;
    private mapSupabaseSessionToSession;
}
