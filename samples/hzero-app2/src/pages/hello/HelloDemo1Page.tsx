import React from 'react';
import styles from './style.less';

const HelloWorldPage: React.FC = () => {
  return (
    <div>
      <div className={styles['test-cls']}>HelloWorldPage </div>
      <div>className: {styles['test-cls']}</div>
    </div>
  );
};

export default HelloWorldPage;
