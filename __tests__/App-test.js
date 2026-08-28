/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  let tree;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  // Let NativeBase's passive effects settle before the env tears down.
  await act(async () => {});
  act(() => {
    tree.unmount();
  });
});
