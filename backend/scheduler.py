from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime


def delete_expired_tokens(app):
    with app.app_context():
        from database import db
        from models import ShareToken
        deleted = ShareToken.query.filter(ShareToken.expires_at < datetime.utcnow()).delete()
        db.session.commit()
        if deleted:
            app.logger.info(f"Temizlendi: {deleted} süresi dolmuş paylaşım token'ı silindi")


def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: delete_expired_tokens(app),
        trigger='interval',
        hours=24,
        id='cleanup_expired_tokens',
        replace_existing=True,
    )
    scheduler.start()
    return scheduler
