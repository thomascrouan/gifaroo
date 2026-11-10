import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { StateMessage } from '../../../shared/components/state-message/state-message';

type FormField = 'name' | 'description';

@Component({
  imports: [ReactiveFormsModule, RouterLink, StateMessage],
  selector: 'app-collection-form',
  styleUrl: './collection-form.scss',
  templateUrl: './collection-form.html',
})
export class CollectionForm {
  id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly collectionService = inject(CollectionService);
  private readonly router = inject(Router);

  protected readonly loading = this.collectionService.loading;
  protected readonly error = this.collectionService.error;
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly isEdit = computed(() => this.id() !== undefined);

  protected readonly collection = computed(() =>
    this.collectionService.collections().find((c) => c.id === this.id()),
  );

  protected readonly submitLabel = computed(() => {
    if (this.saving()) return 'Enregistrement…';
    return this.isEdit() ? 'Enregistrer' : 'Créer la collection';
  });

  protected readonly collectionForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        (control: AbstractControl<string>) => this.uniqueNameValidator(control),
      ],
    ],
    description: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    this.collectionService.load();

    effect(() => {
      const collection = this.collection();
      if (collection && this.collectionForm.pristine) {
        this.collectionForm.patchValue({
          name: collection.name,
          description: collection.description,
        });
      }
    });

    effect(() => {
      this.collectionService.collections();
      this.collectionForm.controls.name.updateValueAndValidity();
    });
  }

  protected showError(field: FormField, error: string): boolean {
    const control = this.collectionForm.controls[field];
    return control.touched && control.hasError(error);
  }

  protected onReload(): void {
    this.collectionService.load();
  }

  protected onSubmit(): void {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);

    const { name, description } = this.collectionForm.getRawValue();
    const payload = { name: name.trim(), description: description.trim() };
    const id = this.id();

    const request$ =
      id !== undefined
        ? this.collectionService.update(id, payload)
        : this.collectionService.create(payload);

    request$.subscribe({
      next: (collection) => this.router.navigate(['/collections', collection.id]),
      error: (error: Error) => {
        this.saving.set(false);
        this.submitError.set(`Enregistrement impossible : ${error.message}`);
      },
    });
  }

  private uniqueNameValidator(control: AbstractControl<string>): ValidationErrors | null {
    return this.collectionService.nameExists(control.value, this.id()) ? { nameTaken: true } : null;
  }
}
