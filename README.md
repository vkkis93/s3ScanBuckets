s3ScanBuckets
======

It's script which get all buckets from your aws account and their permissions(ACL) and writes this information into pdf

Usage
=====
    export AWS_ACCESS_KEY_ID=XXXXXXXXX
    export AWS_SECRET_ACCESS_KEY=XXXXXXXXX
    npm install

And after those steps - run command which below: 
====
    npm start

When execution will be finished - in your current directory you will see the file **s3ACL.pdf**

Requirements
============

Node.js 4.3 or newer
