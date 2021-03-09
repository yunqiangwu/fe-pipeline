
import axios from '@/utils/axios.config';
import { setToken} from '../utils/token';
import { useState, useCallback } from 'react'

export default function useAuthModel() {
  const [initialState, setInitialState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);


  const refresh = useCallback(() => {
    (async () => {
      try{
        setLoading(true);
        const response = await axios.get('/auth/self');
        setLoading(false);
        if(response.data.username) {
          setInitialState( response.data );
        } else {
          throw response
        }
      }catch(e) {
        console.error(e);
        setInitialState(null);
      }
    })();
  }, [])

  const signout = useCallback(() => {
    setToken(null);
    refresh();
    // signout implementation
    // setUser(null)
  }, [])

  return {
    initialState, setInitialState,
    loading,
    logout: signout,
    refresh,
  }
}
