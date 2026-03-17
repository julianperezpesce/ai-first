def execute(title, description):
    from models.task_repository import TaskRepository

    repo = TaskRepository()
    task = repo.create(title, description)
    print(f"Task created: {task['id']} - {task['title']}")
