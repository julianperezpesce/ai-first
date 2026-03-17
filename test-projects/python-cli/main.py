import argparse
from cli.commands import add_command, list_command, remove_command


def main():
    parser = argparse.ArgumentParser(description="Task Manager CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    add_parser = subparsers.add_parser("add", help="Add a new task")
    add_parser.add_argument("title", help="Task title")
    add_parser.add_argument("--description", help="Task description")

    list_parser = subparsers.add_parser("list", help="List all tasks")
    list_parser.add_argument(
        "--status", choices=["pending", "completed"], help="Filter by status"
    )

    remove_parser = subparsers.add_parser("remove", help="Remove a task")
    remove_parser.add_argument("id", type=int, help="Task ID")

    args = parser.parse_args()

    if args.command == "add":
        add_command.execute(args.title, args.description)
    elif args.command == "list":
        list_command.execute(args.status)
    elif args.command == "remove":
        remove_command.execute(args.id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
