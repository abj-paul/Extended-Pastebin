import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasteContentComponent } from './paste-content.component';

describe('PasteContentComponent', () => {
  let component: PasteContentComponent;
  let fixture: ComponentFixture<PasteContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PasteContentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasteContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
