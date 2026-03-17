from models.task import Task
from datetime import datetime


class TaskRepository:
    def __init__(self):
        self.tasks = []
        self._next_id = 1

    def create(self, title, description=""):
        task = Task(self._next_id, title, description)
        self.tasks.append(task)
        self._next_id += 1
        return task.to_dict()

    def find_all(self, status=None):
        if status:
            return [t.to_dict() for t in self.tasks if t.status == status]
        return [t.to_dict() for t in self.tasks]

    def find_by_id(self, task_id):
        for task in self.tasks:
            if task.id == task_id:
                return task.to_dict()
        return None

    def update(self, task_id, data):
        for task in self.tasks:
            if task.id == task_id:
                if "title" in data:
                    task.title = data["title"]
                if "description" in data:
                    task.description = data["description"]
                if "status" in data:
                    task.status = data["status"]
                return task.to_dict()
        return None

    def delete(self, task_id):
        for i, task in enumerate(self.tasks):
            if task.id == task_id:
                self.tasks.pop(i)
                return True
        return False
