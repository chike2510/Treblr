import React, { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    // Your effect logic here
  }, [token, user, loadState]);

  return <div>Your App</div>;
};

export default App;