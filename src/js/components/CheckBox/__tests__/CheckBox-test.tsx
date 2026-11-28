// SPDX-FileCopyrightText: © Hewlett Packard Enterprise Development LP
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import 'jest-styled-components';
import 'jest-axe/extend-expect';
import 'regenerator-runtime/runtime';

import { Grommet } from '../../Grommet';
import { CheckBox } from '..';

describe('CheckBox', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(
      <Grommet>
        <CheckBox a11yTitle="test" />
      </Grommet>,
    );
    const results = await axe(container);
    expect(container.firstChild).toMatchSnapshot();
    expect(results).toHaveNoViolations();
  });

  test('label should not have accessibility violations', async () => {
    const { container } = render(
      <Grommet>
        <CheckBox label="test" />
      </Grommet>,
    );
    const results = await axe(container);
    expect(container.firstChild).toMatchSnapshot();
    expect(results).toHaveNoViolations();
  });

  test('renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox />
        <CheckBox id="test id" name="test name" />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('renders without grommet wrapper', () => {
    const { container } = render(<CheckBox />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('label renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox label="test label" />
        <CheckBox label={<div>test label</div>} />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('checked renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox checked />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('defaultChecked', () => {
    const { container } = render(
      <Grommet>
        <CheckBox defaultChecked />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('disabled renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox disabled />
        <CheckBox disabled checked />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('reverse renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox reverse label="test label" />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('toggle renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox toggle />
        <CheckBox toggle checked />
        <CheckBox toggle label="test label" />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('reverse toggle fill', () => {
    const { container } = render(
      <Grommet>
        <CheckBox label="test label" reverse fill toggle />
        <CheckBox fill toggle label="test label" />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('indeterminate renders', () => {
    const { container } = render(
      <Grommet>
        <CheckBox indeterminate />
        <CheckBox indeterminate label="test label" />
      </Grommet>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('indeterminate is exposed to assistive technology', async () => {
    const { container } = render(
      <Grommet>
        <CheckBox indeterminate label="test label" />
      </Grommet>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'test label',
    }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
    // indeterminate checkboxes are neither checked nor unchecked
    expect(screen.queryByRole('checkbox', { checked: false })).toBeNull();
    expect(screen.queryByRole('checkbox', { checked: true })).toBeNull();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('indeterminate is cleared when checked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(
      <Grommet>
        <CheckBox indeterminate label="test label" onChange={onChange} />
      </Grommet>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'test label',
    }) as HTMLInputElement;
    await user.click(checkbox);
    expect(onChange).toHaveBeenCalled();
    expect(checkbox.indeterminate).toBe(false);
    expect(checkbox.checked).toBe(true);

    rerender(
      <Grommet>
        <CheckBox label="test label" onChange={onChange} />
      </Grommet>,
    );
    expect(checkbox.indeterminate).toBe(false);
  });

  test('indeterminate is not applied to toggle', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(
      <Grommet>
        <CheckBox indeterminate toggle label="test label" />
      </Grommet>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'test label',
    }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(false);

    warnSpy.mockRestore();
  });

  test('forwards ref to the input when indeterminate', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <Grommet>
        <CheckBox ref={ref} indeterminate label="test label" />
      </Grommet>,
    );

    expect(ref.current).toBe(screen.getByRole('checkbox'));
    expect(ref.current?.indeterminate).toBe(true);
  });

  test('indeterminate checked warns', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(
      <Grommet>
        <CheckBox indeterminate checked />
      </Grommet>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Checkbox cannot be "checked" and "indeterminate" at the same time.',
    );

    warnSpy.mockReset();
    warnSpy.mockRestore();
  });

  test('indeterminate toggle warns', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(
      <Grommet>
        <CheckBox indeterminate toggle />
      </Grommet>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Checkbox of type toggle does not have "indeterminate" state.',
    );

    warnSpy.mockReset();
    warnSpy.mockRestore();
  });

  test('controlled', () => {
    const { container, getByText } = render(
      <Grommet>
        <CheckBox label="test-label" checked />
      </Grommet>,
    );
    expect(container.firstChild).toMatchSnapshot();
    fireEvent.click(getByText('test-label'));
    expect(container.firstChild).toMatchSnapshot();
  });

  test('custom theme', () => {
    const customTheme = {
      checkBox: {
        pad: {
          horizontal: 'small',
          vertical: 'xsmall',
        },
      },
    };

    const { container } = render(
      <Grommet theme={customTheme}>
        <CheckBox label="test-label" />
      </Grommet>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('renders custom checked icon', () => {
    const CustomCheckedIcon = () => <svg data-testid="custom-checkBox-icon" />;
    const customTheme = {
      checkBox: {
        icons: {
          checked: CustomCheckedIcon,
        },
      },
    };

    const { container, getByTestId } = render(
      <Grommet theme={customTheme}>
        <CheckBox label="test-label" checked />
      </Grommet>,
    );
    expect(container.firstChild).toMatchSnapshot();
    expect(getByTestId('custom-checkBox-icon')).toBeDefined();
  });

  test('renders a11yTitle and aria-label', async () => {
    const LABEL = 'Label';
    const { container, getByLabelText } = render(
      <Grommet>
        <CheckBox a11yTitle={LABEL} />
        <CheckBox aria-label={`${LABEL}-2`} />
      </Grommet>,
    );
    expect(getByLabelText(LABEL)).toBeTruthy();
    expect(getByLabelText(`${LABEL}-2`)).toBeTruthy();
    expect(container.firstChild).toMatchSnapshot();
  });

  test('theme gap', () => {
    const customTheme = {
      checkBox: {
        gap: 'large',
      },
    };

    const { asFragment } = render(
      <Grommet theme={customTheme}>
        <CheckBox label="test label" />
        <CheckBox label="test label" reverse />
        <CheckBox label="test label" toggle />
      </Grommet>,
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
