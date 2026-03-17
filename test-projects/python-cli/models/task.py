from datetime import datetime


class Task:
    def __init__(self, id, title, description, status="pending", created_at=None):
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.created_at = created_at or datetime.now()

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
