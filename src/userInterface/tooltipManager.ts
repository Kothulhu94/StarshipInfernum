class TooltipManager {
  private tooltipEl: HTMLDivElement | null = null;

  constructor() {
    // Only run in browser environment
    if (typeof document === 'undefined') return;

    this.initTooltipElement();
    this.initListeners();
  }

  private initTooltipElement() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'ui-tooltip';
    this.tooltipEl.style.position = 'absolute';
    this.tooltipEl.style.pointerEvents = 'none';
    this.tooltipEl.style.visibility = 'hidden';
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.zIndex = '9999';
    this.tooltipEl.style.backgroundColor = 'var(--color-hull-gunmetal, #1e2430)';
    this.tooltipEl.style.color = 'var(--color-text-primary, #e2e8f0)';
    this.tooltipEl.style.border = '1px solid var(--color-console-cyan-dim, #38b2ac)';
    this.tooltipEl.style.borderRadius = 'var(--radius-md, 6px)';
    this.tooltipEl.style.padding = 'var(--space-xs) var(--space-sm, 8px 12px)';
    this.tooltipEl.style.boxShadow = 'var(--shadow-panel), var(--shadow-glow-cyan)';
    this.tooltipEl.style.fontSize = '12px';
    this.tooltipEl.style.lineHeight = 'var(--line-height-relaxed, 1.5)';
    this.tooltipEl.style.fontFamily = 'var(--font-body, "Inter", sans-serif)';
    this.tooltipEl.style.maxWidth = '280px';
    this.tooltipEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    this.tooltipEl.style.transform = 'translateY(5px)';
    
    document.body.appendChild(this.tooltipEl);
  }

  private initListeners() {
    document.addEventListener('mouseover', (e) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]');
      if (!target) return;

      const tooltipText = target.getAttribute('data-tooltip');
      if (!tooltipText) return;

      this.show(target as HTMLElement, tooltipText);
    });

    document.addEventListener('mouseout', (e) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]');
      if (target) {
        this.hide();
      }
    });

    // Hide on click or scroll to prevent sticking
    document.addEventListener('click', () => this.hide());
    document.addEventListener('scroll', () => this.hide(), { passive: true });
  }

  private show(target: HTMLElement, text: string) {
    if (!this.tooltipEl) return;

    this.tooltipEl.innerHTML = text;
    this.tooltipEl.style.visibility = 'visible';
    this.tooltipEl.style.opacity = '1';

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    // Default: Position above target
    let top = window.scrollY + targetRect.top - tooltipRect.height - 8;
    let left = window.scrollX + targetRect.left + (targetRect.width - tooltipRect.width) / 2;

    this.tooltipEl.style.transform = 'translateY(-5px)';

    // If it would overflow the top of the viewport, show below instead
    if (targetRect.top - tooltipRect.height < 10) {
      top = window.scrollY + targetRect.bottom + 8;
      this.tooltipEl.style.transform = 'translateY(5px)';
    }

    // Horizontal boundary safety checks
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    this.tooltipEl.style.top = `${top}px`;
    this.tooltipEl.style.left = `${left}px`;
  }

  private hide() {
    if (!this.tooltipEl) return;
    this.tooltipEl.style.opacity = '0';
    this.tooltipEl.style.visibility = 'hidden';
    this.tooltipEl.style.transform = 'translateY(0)';
  }
}

export const tooltipManager = new TooltipManager();
export default tooltipManager;
