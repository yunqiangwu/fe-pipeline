import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { InjectS3 } from 'nestjs-s3';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AppService implements OnModuleInit {

  private helloMessage: string;

  constructor(private configService: ConfigService,
    @InjectS3() private readonly s3: S3,
  ) {
    this.helloMessage = configService.get('HELLO_MESSAGE');
  }

  getHello(): string {
    return this.helloMessage;
  }

  getConfig(): any {
    return this.configService.configObj.config;
  }

  async onModuleInit() {


    const bucketName = 'bucket';

    try {

      // 判断是否存在
      await this.s3.headBucket({ Bucket: bucketName }).promise();

      // console.log('delete ------')

      // const objects = await this.s3.listObjectsV2({ Bucket: bucketName }).promise();

      // for (const item of objects.Contents) {
      //   await this.s3.deleteObject({
      //     Bucket: bucketName,
      //     Key: item.Key,
      //   }).promise();
      // }

      // await this.s3.deleteBucket({ Bucket: bucketName }).promise();
    } catch (e) {
      console.error(e);

      try {
        console.log('create ------')
        await this.s3.createBucket({
          Bucket: bucketName
        }).promise();
  
        var params = {
          Bucket: bucketName,
          Policy: "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:ListBucket\",\"s3:GetBucketLocation\"],\"Resource\":[\"arn:aws:s3:::" + bucketName + "\"]},{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::" + bucketName + "/*\"]}]}"
        };
  
        this.s3.putBucketPolicy(params).promise();
  
      } catch (e) {
        console.error(e);
      }
  
      try {
        console.error('res ------')
  
        await this.s3.putObject({
          Bucket: bucketName, Key: 'ddd/xx.html', Body: '<h1>xx</h1>',
          ContentDisposition: 'text/plain;charset=utf-8',
          ContentType: 'text/plain',
          Metadata: {
            a: '3',
          }
        }).promise();
  
        const res = await this.s3.getObject({ Bucket: bucketName, Key: 'ddd/xx.html' }).promise();
        console.log('res:', res);
      } catch (e) {
        console.log(e);
      }
  
      try {
        console.error('copy ------')
        const res = await this.s3.copyObject({ Bucket: bucketName, Key: 'ddd2/xx.html', CopySource: `${bucketName}/ddd/xx.html` }).promise();
  
        console.log('res:', res);
      } catch (e) {
        console.log(e);
      }

    }

    

  }
}
