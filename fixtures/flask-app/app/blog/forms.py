"""Blog forms."""

from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, BooleanField, SubmitField, SelectField
from wtforms.validators import DataRequired, Length


class PostForm(FlaskForm):
    """Blog post form."""

    title = StringField("Title", validators=[DataRequired(), Length(min=1, max=200)])
    summary = TextAreaField("Summary", validators=[Length(max=500)])
    content = TextAreaField("Content", validators=[DataRequired()])
    category_id = SelectField("Category", coerce=int, choices=[])
    tags = StringField("Tags (comma separated)")
    is_published = BooleanField("Publish immediately")
    submit = SubmitField("Save Post")

    def __init__(self, *args, **kwargs):
        """Initialize form with categories."""
        super(PostForm, self).__init__(*args, **kwargs)
        from app.models import Category

        self.category_id.choices = [(0, "No Category")] + [
            (c.id, c.name) for c in Category.query.all()
        ]


class CommentForm(FlaskForm):
    """Comment form."""

    content = TextAreaField(
        "Comment", validators=[DataRequired(), Length(min=1, max=2000)]
    )
    submit = SubmitField("Post Comment")
