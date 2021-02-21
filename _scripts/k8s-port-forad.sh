#!/usr/bin/env bash

echo '
apiVersion: v1
kind: Service
metadata:
  name: test-ws-pod-svc
spec:
  ports:
  - name: http
    port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    ws-podName: ws-podName
  type: ClusterIP
' | kubectl -n default apply -f - 

kubectl -n default port-forward svc/test-ws-pod-svc 3001:3000 --address 0.0.0.0

# kubectl -n default port-forward po/`kubectl get po -l ws-podName=ws-podName -o jsonpath="{.items[0].metadata.name}"` 3001:3000 --address 0.0.0.0