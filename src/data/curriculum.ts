import type { Lesson, ProjectFiles } from '../../shared/types';

const tutorial = 'https://docs.djangoproject.com/en/5.2/intro/';

export const lessons: Lesson[] = [
  {
    id: 'intro', number: 1, title: 'Introduction to Django', subtitle: 'Find your way around a Django project.', duration: 15,
    objectives: ['Explain what a web framework does.', 'Distinguish a project from an app.', 'Identify settings, routes, and management commands.'],
    sections: [
      { title: 'From a browser to Python', body: 'A browser sends an HTTP request to a server. Django helps your Python code receive that request, find the right behavior, and return a response. A framework supplies common building blocks so you can concentrate on your application.' },
      { title: 'One project, focused apps', body: 'A project gathers site configuration. An app groups a feature, such as polls. Our mysite package contains settings and top-level routes; polls contains the feature you will build. A project can use several apps. The __init__.py files identify ordinary Python packages.' },
      { title: 'Read the project map', body: 'Open manage.py, mysite/settings.py, and mysite/urls.py in the file explorer. manage.py provides project-aware management commands. settings.py configures this site. urls.py points incoming paths toward application code. Read first; you do not need to change these files for this activity.', code: 'manage.py\nmysite/\n    settings.py\n    urls.py\npolls/\n    views.py\n    models.py\n    templates/' },
      { title: 'Understand the development server', body: 'Run Project will ask an isolated runtime to start Django’s development server. The underlying command is python manage.py runserver. This server is intended for development. Here, execution controls remain unavailable until a real runtime is connected; the editor and knowledge check still work.' },
    ],
    docs: [{ title: 'Django: first project and app', url: `${tutorial}tutorial01/` }, { title: 'Python: packages', url: 'https://docs.python.org/3/tutorial/modules.html#packages' }],
    file: 'manage.py',
    exercise: { title: 'Read the project map', instructions: ['Inspect manage.py and the two mysite files.', 'Locate the polls app and the files it owns.', 'Answer the project-map questions below, then check your understanding.'], requirements: ['Identify the site settings file.', 'Explain the job of manage.py.', 'Distinguish a project from an app.'] },
    hints: ['Look at DJANGO_SETTINGS_MODULE in manage.py.', 'mysite is configuration; polls is one feature inside the site.', 'No Python needs to run to inspect the file structure.'],
    quiz: [
      { id: 'settings', prompt: 'Which file contains configuration for this site?', options: ['polls/views.py', 'mysite/settings.py', 'polls/templates/polls/index.html'], answer: 1, explanation: 'mysite/settings.py contains site configuration, including installed apps and database settings.' },
      { id: 'manage', prompt: 'What is manage.py used for?', options: ['Running commands with this project’s settings', 'Storing HTML templates', 'Replacing every app in the project'], answer: 0, explanation: 'manage.py is the project-aware entry point for Django management commands.' },
      { id: 'app', prompt: 'What is the polls directory in this starter?', options: ['The browser', 'A separate Python installation', 'A Django app for the polling feature'], answer: 2, explanation: 'polls groups the polling feature; mysite holds the project configuration.' },
    ], requiresRuntime: false,
  },
  {
    id: 'urls', number: 2, title: 'URLs and Views', subtitle: 'Turn a request into your first response.', duration: 25,
    objectives: ['Follow a URL pattern to a view.', 'Return an HTTP response from a view.', 'Connect the polls route at /polls/.'],
    sections: [
      { title: 'A request needs a destination', body: 'A URL configuration maps paths to views. Django checks patterns in order and uses the first match. mysite/urls.py includes polls.urls at polls/, so the app matches the remaining part of the path. The empty app path matches /polls/.' },
      { title: 'A view receives and returns', body: 'A function-based view receives a request object and returns an HTTP response. A response carries content and a status code. For example, this unrelated status view returns a small text response:', code: 'from django.http import HttpResponse\n\ndef status(request):\n    return HttpResponse("Service is ready")' },
      { title: 'Connect the pieces', body: 'Import a view and pass the function itself to path(). Calling a view during import runs it too early. Give routes names so templates can refer to them later.', code: 'from django.urls import path\nfrom . import views\n\n# Example for a separate status endpoint:\nurlpatterns = [path("status/", views.status, name="status")]' },
      { title: 'Read errors as clues', body: 'A 404 means no matching resource was found; inspect both URL configurations and the requested path. A NameError often means a name is missing or misspelled. A view that returns None needs an explicit response. Read the final traceback line, then find the first frame in your own file.' },
    ],
    docs: [{ title: 'Django: first view', url: `${tutorial}tutorial01/#write-your-first-view` }, { title: 'Django: URL dispatcher', url: 'https://docs.djangoproject.com/en/5.2/topics/http/urls/' }],
    file: 'polls/views.py',
    exercise: { title: 'Welcome visitors to your poll', instructions: ['Implement index(request) in polls/views.py. Return an HTTP 200 response containing Welcome to the polls.', 'Add a named index route for the empty path in polls/urls.py.', 'Keep the project-level polls/ include. Save your files. When a runtime is connected, use Check My Work for behavioral verification.'], requirements: ['GET /polls/ returns HTTP 200.', 'The response contains Welcome to the polls.', 'The route is named index in the polls namespace.'] },
    hints: ['HttpResponse is already imported in the starter.', 'The project removes polls/ before matching the app URL configuration.', 'Pass views.index to path(); do not call views.index().'],
    quiz: [
      { id: 'view', prompt: 'What must a normal function-based Django view return?', options: ['A file path', 'An HTTP response', 'A URL pattern'], answer: 1, explanation: 'Django sends the returned HTTP response to the client.' },
      { id: 'route', prompt: 'The project includes polls.urls at polls/. Which app path matches /polls/?', options: ['An empty string', 'polls/', '/polls/'], answer: 0, explanation: 'include() removes the matched prefix before the app checks the remainder.' },
    ], requiresRuntime: true,
  },
  {
    id: 'templates', number: 3, title: 'Templates', subtitle: 'Separate your page structure from Python.', duration: 30,
    objectives: ['Render an HTML template from a view.', 'Pass a value through template context.', 'Use a base template and content block.'],
    sections: [
      { title: 'Give presentation a home', body: 'Templates combine text such as HTML with placeholders and tags. Keep data preparation in Python and page structure in templates. render(request, template_name, context) produces a response using a context dictionary.' },
      { title: 'Pass named values', body: 'Dictionary keys become template variables. Double braces display values; tags use braces and percent signs. Keep automatic HTML escaping enabled for user-provided text.', code: '# Example for a separate profile page:\nreturn render(request, "profile.html", {"display_name": "Sam"})\n\n# Inside profile.html:\n<h1>Hello, {{ display_name }}</h1>' },
      { title: 'Reuse the page shell', body: 'A base template provides shared HTML and named blocks. A child begins with extends and fills selected blocks. The starter includes polls/base.html; put the poll page inside its content block.', code: '{% extends "polls/base.html" %}\n{% block content %}\n  <!-- Your page content belongs here. -->\n{% endblock %}' },
      { title: 'Find a missing template', body: 'For TemplateDoesNotExist, check the template name, directory nesting, installed app, and APP_DIRS setting. If a variable is blank, compare the context key with its template name.' },
    ],
    docs: [{ title: 'Django: templates in a view', url: `${tutorial}tutorial03/` }, { title: 'Django: template language and inheritance', url: 'https://docs.djangoproject.com/en/5.2/ref/templates/language/' }],
    file: 'polls/templates/polls/index.html',
    exercise: { title: 'Build a reusable poll page', instructions: ['Extend polls/base.html in polls/index.html and fill the content block.', 'Display Welcome to the polls in an h1 through a heading context variable.', 'Update index to render this template with the heading value. Preserve the named URL route from lesson 2.'], requirements: ['GET /polls/ renders polls/index.html.', 'The template extends polls/base.html.', 'The response has an h1 containing the supplied heading.'] },
    hints: ['Use the full template name polls/index.html.', 'The name in {{ heading }} must match a context dictionary key.', 'extends should be the first template tag.'],
    quiz: [
      { id: 'variable', prompt: 'Which syntax displays a template context value?', options: ['{% heading %}', '{{ heading }}', 'print(heading)'], answer: 1, explanation: 'Double braces display a variable from the template context.' },
      { id: 'inheritance', prompt: 'What do extends and block help you do?', options: ['Apply database migrations', 'Run arbitrary Python in HTML', 'Reuse a shared page layout'], answer: 2, explanation: 'A child template fills named blocks supplied by a base template.' },
    ], requiresRuntime: true,
  },
  {
    id: 'models', number: 4, title: 'Models and Databases', subtitle: 'Make your polling project remember questions.', duration: 40,
    objectives: ['Describe tables, rows, and fields.', 'Define a Question model.', 'Distinguish making migrations from applying them.', 'Display database-backed questions using the ORM.'],
    sections: [
      { title: 'Give data a structure', body: 'A relational database organizes records in tables. Think of a row as one record and a column as one kind of value. Django models describe that structure with Python classes. A model normally maps to a table, and its fields describe columns. SQLite stores the starter’s database in one file.' },
      { title: 'Choose fields deliberately', body: 'Subclass models.Model. Use CharField with max_length for a short question and DateTimeField for its publication time. Django supplies a primary key unless you define one. Here is a different model as an example:', code: 'from django.db import models\n\nclass Bookmark(models.Model):\n    label = models.CharField(max_length=120)\n    created_at = models.DateTimeField()' },
      { title: 'Change the schema in two steps', body: 'Editing a model alone does not update database tables. makemigrations records model changes in migration files; migrate applies those operations to the database. The workspace’s Apply Migrations control asks the isolated service to perform these approved steps. Keep generated migration files with the project.', code: 'python manage.py makemigrations polls\npython manage.py migrate' },
      { title: 'Ask for objects, then render them', body: 'The object-relational mapper (ORM) turns Python queries into database operations. objects.all() selects records; filter() narrows them; order_by() sorts them. A QuerySet is evaluated when its results are needed. Pass questions to the template and loop over them. Handle an empty database with a helpful message.', code: '# Example for the unrelated Bookmark model:\nbookmarks = Bookmark.objects.order_by("label")\n\n# A template can loop over a context collection:\n{% for bookmark in bookmarks %}\n  <p>{{ bookmark.label }}</p>\n{% empty %}\n  <p>No bookmarks yet.</p>\n{% endfor %}' },
      { title: 'Debug the database boundary', body: 'For no such table, confirm migrations were created and applied in the same runtime database. For an import error, check the class name and module. An empty QuerySet can be a valid result: first verify whether records exist. Do not erase a database to hide an error.' },
    ],
    docs: [{ title: 'Django: models and database setup', url: `${tutorial}tutorial02/` }, { title: 'Django: model fields', url: 'https://docs.djangoproject.com/en/5.2/topics/db/models/' }, { title: 'Django: migrations', url: 'https://docs.djangoproject.com/en/5.2/topics/migrations/' }, { title: 'Django: ORM queries', url: 'https://docs.djangoproject.com/en/5.2/topics/db/queries/' }],
    file: 'polls/models.py',
    exercise: { title: 'Show questions from the database', instructions: ['Define Question with question_text (CharField, max_length=200) and pub_date (DateTimeField).', 'When a runtime is available, apply migrations. This control creates migrations for polls and applies them; inspect its real output.', 'Query Question records in index, pass them as questions, and list their question_text values in the template.', 'Show No polls available. when the database is empty. Keep the heading from lesson 3. The trusted runtime tests will create their own sample records.'], requirements: ['Question has the requested fields.', 'Migrations create its database table.', 'GET /polls/ displays question records.', 'An empty database displays No polls available.'] },
    hints: ['Keep the polls app in INSTALLED_APPS.', 'Use a QuerySet, rather than a hardcoded list of question text.', 'The {% empty %} branch belongs inside the template loop.'],
    quiz: [
      { id: 'schema', prompt: 'Which step records model changes as migration files?', options: ['runserver', 'migrate', 'makemigrations'], answer: 2, explanation: 'makemigrations creates migration files; migrate applies their operations.' },
      { id: 'orm', prompt: 'What does Question.objects.all() represent?', options: ['A QuerySet of Question records', 'An HTML template', 'A new migration file'], answer: 0, explanation: 'The ORM returns a QuerySet that can retrieve model records from the database.' },
    ], requiresRuntime: true,
  },
];

export const milestones = [
  { id: 'project-map', title: 'Understand the starter project', lessonId: 'intro' },
  { id: 'first-view', title: 'Create your first Django view', lessonId: 'urls' },
  { id: 'connect-url', title: 'Connect a URL to the view', lessonId: 'urls' },
  { id: 'render-template', title: 'Display a reusable template', lessonId: 'templates' },
  { id: 'question-model', title: 'Create a Question model', lessonId: 'models' },
  { id: 'migrations', title: 'Apply database migrations', lessonId: 'models' },
  { id: 'database-page', title: 'Display questions from the database', lessonId: 'models' },
];

export const starterFiles: ProjectFiles = {
  'manage.py': '"""Project-aware Django command entry point."""\nimport os\nimport sys\n\nif __name__ == "__main__":\n    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")\n    from django.core.management import execute_from_command_line\n    execute_from_command_line(sys.argv)\n',
  'mysite/__init__.py': '',
  'mysite/settings.py': '"""Learning-only settings. Not a production deployment configuration."""\nfrom pathlib import Path\n\nBASE_DIR = Path(__file__).resolve().parent.parent\nSECRET_KEY = "learning-project-only-not-a-production-secret"\nDEBUG = False\nALLOWED_HOSTS = ["*"]  # Isolated preview only; restrict before any real deployment.\nINSTALLED_APPS = ["polls"]\nMIDDLEWARE = [\n    "django.middleware.security.SecurityMiddleware",\n    "django.middleware.common.CommonMiddleware",\n    "django.middleware.csrf.CsrfViewMiddleware",\n]\nROOT_URLCONF = "mysite.urls"\nTEMPLATES = [{\n    "BACKEND": "django.template.backends.django.DjangoTemplates",\n    "DIRS": [],\n    "APP_DIRS": True,\n    "OPTIONS": {"context_processors": []},\n}]\nDATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}\nDEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"\nUSE_TZ = True\nTIME_ZONE = "UTC"\n',
  'mysite/urls.py': 'from django.urls import include, path\n\nurlpatterns = [\n    path("polls/", include("polls.urls")),\n]\n',
  'polls/__init__.py': '',
  'polls/apps.py': 'from django.apps import AppConfig\n\nclass PollsConfig(AppConfig):\n    default_auto_field = "django.db.models.BigAutoField"\n    name = "polls"\n',
  'polls/views.py': 'from django.http import HttpResponse\nfrom django.shortcuts import render\n\n\ndef index(request):\n    # Lesson 2: return your own welcome response.\n    # Lesson 3: render the poll template with context.\n    # Lesson 4: query Question records and pass them to the template.\n    return HttpResponse("This view is not implemented yet.", status=501)\n',
  'polls/urls.py': 'from django.urls import path\nfrom . import views\n\napp_name = "polls"\nurlpatterns = [\n    # Lesson 2: connect the empty path to the index view.\n]\n',
  'polls/models.py': 'from django.db import models\n\n# Lesson 4: define the Question model and its fields here.\n',
  'polls/migrations/__init__.py': '',
  'polls/templates/polls/base.html': '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>{% block title %}Community Polls{% endblock %}</title>\n</head>\n<body>\n  <main>{% block content %}{% endblock %}</main>\n</body>\n</html>\n',
  'polls/templates/polls/index.html': '{# Lesson 3: extend the base template and fill its content block. #}\n{# Display the heading passed by your view. #}\n{# Lesson 4: list questions and handle an empty database. #}\n',
  'requirements.txt': 'Django>=5.2,<5.3\n',
};
