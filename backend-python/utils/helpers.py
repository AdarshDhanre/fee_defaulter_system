from datetime import datetime

def is_overdue(deadline):
    return datetime.now() > deadline