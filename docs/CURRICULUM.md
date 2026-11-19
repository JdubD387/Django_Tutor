# Curriculum and learning state

The beginner path targets **Django 5.2**. Four lessons introduce the project map, URLs/views, templates, and models/databases. One shared, deliberately unfinished polling starter carries the learner through seven milestones. Existing files are never reinitialized on lesson navigation. Worked examples use unrelated status/profile/bookmark examples where possible; assignments are left for the learner.

The first activity is a project-map knowledge check. All questions must pass to complete the introductory lesson. The other lessons have independent knowledge checks, but their coding work remains incomplete until trusted behavioral runtime verification succeeds. A knowledge check does not execute Python, inspect its behavior, or replace Django tests. Saved completion is local learning progress, not a secure credential or certificate.

The curriculum is data in `src/data/curriculum.ts`; add lessons to its exported array and add project milestones there. `shared/types.ts` defines the authoring contract. Each lesson carries objectives, explanations, examples, hints, documentation, exercise requirements, and quiz feedback. The server must separately own trusted runtime evaluation suites; ordinary learner files must never be used as trusted grading code.

The `src/lib/persistence.ts` repository uses IndexedDB database `django-tutor`, object store `state`, key `learner-state`. It validates the stored version and project paths; strips unknown preference and top-level fields; saves snapshots serially; and forces AI mode to disabled in persisted and loaded data. It stores no API key. Errors are surfaced rather than replaced with a new project. Invalid or future-version data is preserved and refuses ordinary overwriting. Browser storage belongs to this origin/device, may be cleared or blocked, and does not synchronize. Keep one editing tab open at a time; multi-tab conflict resolution and project export are future work. Copy important code before clearing site storage.

Official teaching sources consulted on 2026-11-18:

- [Django tutorial: project, apps, and first view](https://docs.djangoproject.com/en/5.2/intro/tutorial01/)
- [Django tutorial: model and database setup](https://docs.djangoproject.com/en/5.2/intro/tutorial02/)
- [Django tutorial: public views and templates](https://docs.djangoproject.com/en/5.2/intro/tutorial03/)
- [Django template language](https://docs.djangoproject.com/en/5.2/ref/templates/language/)
- [Django URL dispatcher](https://docs.djangoproject.com/en/5.2/topics/http/urls/)
- [Django models](https://docs.djangoproject.com/en/5.2/topics/db/models/)
- [Django migrations](https://docs.djangoproject.com/en/5.2/topics/migrations/)
- [Django ORM queries](https://docs.djangoproject.com/en/5.2/topics/db/queries/)
- [Python packages](https://docs.python.org/3/tutorial/modules.html#packages)

No learner Python or Django project has been executed as part of writing these modules. Automated tests here verify knowledge-check logic, completion boundaries, storage roundtrips, malformed-data preservation, and secret exclusion. A real isolated runner is a separate integration requirement.
