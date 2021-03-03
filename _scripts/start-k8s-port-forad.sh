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
    fe-pipeline: ws
  type: ClusterIP
' | kubectl -n fe-pipeline apply -f - 

kubectl -n fe-pipeline port-forward svc/test-ws-pod-svc 3001:3000 --address 0.0.0.0

# kubectl -n fe-pipeline port-forward po/`kubectl get po -l fe-pipeline=ws -o jsonpath="{.items[0].metadata.name}"` 3001:3000 --address 0.0.0.0

