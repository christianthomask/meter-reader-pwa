import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('accepts and applies a custom className', () => {
    render(<Button className="custom-class">Styled</Button>);
    const button = screen.getByRole('button', { name: /styled/i });
    expect(button.className).toContain('custom-class');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Press</Button>);
    await user.click(screen.getByRole('button', { name: /press/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByRole('button', { name: /disabled/i }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
