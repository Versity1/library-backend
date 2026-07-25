from django.core.management.base import BaseCommand
from apps.authentication.models import User, UserRole
from apps.policies.models import InstitutionPolicy
from apps.catalog.models import Category, Book, BookCopy, BookCopyStatus
from apps.transactions.models import Transaction, TransactionStatus
from apps.fines.models import Fine, FineStatus
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds initial test data for Library Management System'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Create Policies
        policy_student, _ = InstitutionPolicy.objects.get_or_create(
            role=UserRole.STUDENT,
            defaults={
                'max_borrow_limit': 3,
                'default_loan_days': 14,
                'fine_rate_per_day': 0.50,
                'grace_period_days': 2,
                'reservation_hold_hours': 48,
            }
        )
        policy_staff, _ = InstitutionPolicy.objects.get_or_create(
            role=UserRole.LIBRARIAN,
            defaults={
                'max_borrow_limit': 7,
                'default_loan_days': 30,
                'fine_rate_per_day': 0.25,
                'grace_period_days': 3,
                'reservation_hold_hours': 72,
            }
        )

        # 2. Create Users
        admin_user, _ = User.objects.get_or_create(
            email='admin@institution.edu',
            defaults={
                'username': 'admin',
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'role': UserRole.ADMIN,
                'department': 'Administration',
                'student_staff_id': 'ADM-9001',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if not admin_user.check_password('admin123'):
            admin_user.set_password('admin123')
            admin_user.save()

        librarian_user, _ = User.objects.get_or_create(
            email='librarian@institution.edu',
            defaults={
                'username': 'librarian',
                'first_name': 'David',
                'last_name': 'Miller',
                'role': UserRole.LIBRARIAN,
                'department': 'Library Services',
                'student_staff_id': 'LIB-1002',
                'is_staff': True,
            }
        )
        if not librarian_user.check_password('librarian123'):
            librarian_user.set_password('librarian123')
            librarian_user.save()

        student_user, _ = User.objects.get_or_create(
            email='student@institution.edu',
            defaults={
                'username': 'student',
                'first_name': 'Alex',
                'last_name': 'Rivera',
                'role': UserRole.STUDENT,
                'department': 'Computer Science',
                'student_staff_id': 'STU-4829',
                'borrowing_limit': 3,
            }
        )
        if not student_user.check_password('student123'):
            student_user.set_password('student123')
            student_user.save()

        # 3. Create Categories
        cs_cat, _ = Category.objects.get_or_create(name='Computer Science', code='CS', description='Software Engineering & Algorithms')
        eng_cat, _ = Category.objects.get_or_create(name='Engineering', code='ENG', description='Electrical & Mechanical Systems')
        bus_cat, _ = Category.objects.get_or_create(name='Business & Finance', code='BUS', description='Management & Financial Economics')

        # 4. Create Books
        b1, _ = Book.objects.get_or_create(
            isbn='978-0131103627',
            defaults={
                'title': 'The C Programming Language',
                'author': 'Brian W. Kernighan, Dennis M. Ritchie',
                'category': cs_cat,
                'department': 'Computer Science',
                'publisher': 'Prentice Hall',
                'publication_year': 1988,
                'description': 'The classic guide to modern systems programming in C.',
                'cover_image_url': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
                'location_shelf': 'Shelf 4B, Row 2',
                'total_copies': 4,
                'available_copies': 3,
            }
        )

        b2, _ = Book.objects.get_or_create(
            isbn='978-0262033848',
            defaults={
                'title': 'Introduction to Algorithms',
                'author': 'Thomas H. Cormen, Charles E. Leiserson',
                'category': cs_cat,
                'department': 'Computer Science',
                'publisher': 'MIT Press',
                'publication_year': 2009,
                'description': 'Comprehensive textbook covering algorithmic design and complexity analysis.',
                'cover_image_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
                'location_shelf': 'Shelf 4B, Row 5',
                'total_copies': 5,
                'available_copies': 4,
            }
        )

        b3, _ = Book.objects.get_or_create(
            isbn='978-0132350884',
            defaults={
                'title': 'Clean Code: Handbook of Software Craftsmanship',
                'author': 'Robert C. Martin',
                'category': cs_cat,
                'department': 'Computer Science',
                'publisher': 'Prentice Hall',
                'publication_year': 2008,
                'description': 'Best practices for writing readable, maintainable, and robust code.',
                'cover_image_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
                'location_shelf': 'Shelf 3A, Row 1',
                'total_copies': 3,
                'available_copies': 2,
            }
        )

        # 5. Create Book Copies with scannable QR Code IDs
        c1, _ = BookCopy.objects.get_or_create(qr_code_id='QR-CS-001', defaults={'book': b1, 'status': BookCopyStatus.AVAILABLE})
        c2, _ = BookCopy.objects.get_or_create(qr_code_id='QR-CS-002', defaults={'book': b1, 'status': BookCopyStatus.AVAILABLE})
        c3, _ = BookCopy.objects.get_or_create(qr_code_id='QR-CS-003', defaults={'book': b1, 'status': BookCopyStatus.AVAILABLE})
        c4, _ = BookCopy.objects.get_or_create(qr_code_id='QR-CS-004', defaults={'book': b1, 'status': BookCopyStatus.BORROWED})

        c5, _ = BookCopy.objects.get_or_create(qr_code_id='QR-ALGO-001', defaults={'book': b2, 'status': BookCopyStatus.AVAILABLE})
        c6, _ = BookCopy.objects.get_or_create(qr_code_id='QR-CLEAN-001', defaults={'book': b3, 'status': BookCopyStatus.BORROWED})

        # 6. Create active loan & sample fine
        now = timezone.now()
        loan, created = Transaction.objects.get_or_create(
            book_copy=c6,
            user=student_user,
            status=TransactionStatus.BORROWED,
            defaults={
                'issued_by': librarian_user,
                'issue_date': now - timedelta(days=20),
                'due_date': now - timedelta(days=6), # 6 days overdue
            }
        )

        if created or not Fine.objects.filter(transaction=loan).exists():
            Fine.objects.get_or_create(
                transaction=loan,
                user=student_user,
                defaults={
                    'amount': 2.00, # 4 billable days * ₦0.50
                    'overdue_days': 6,
                    'status': FineStatus.UNPAID
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with test credentials and catalog!'))
