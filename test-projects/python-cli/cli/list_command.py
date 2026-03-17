def execute(status_filter=None):
    from models.task_repository import TaskRepository

    repo = TaskRepository()
    tasks = repo.find_all(status_filter)
    for task in tasks:
        print(f"{task['id']}: {task['title']} [{task['status']}]")
