def execute(task_id):
    from models.task_repository import TaskRepository

    repo = TaskRepository()
    repo.delete(task_id)
    print(f"Task {task_id} removed")
