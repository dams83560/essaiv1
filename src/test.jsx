import React from 'react';

function Test() {
  console.log("Test Component: process =", process);
  console.log("Test Component: process.env =", process.env);

  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a test.</p>
    </div>
  );
}

export default Test;