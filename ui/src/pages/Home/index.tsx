import React, { FC, ChangeEvent } from 'react';
import axios from 'axios';

const Home: FC = () => {
  const uploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const file = files[0];
      const form = new FormData();
      form.append('file', file);
      form.append('package', "hzero-front-hiam")
      form.append('version', '0.0.4')
      console.log(file)
      axios.post('/deploy/version-create', form).then(res => console.log(res));
    }
  }
  return (
    <div>
      <input type="file" onChange={uploadFile}/>
    </div>
  )
}

export default Home;