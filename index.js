'use strict';

const AWS = require('aws-sdk'),
    s3 = new AWS.S3({ region: 'eu-west-1' }),
    Promise = require('bluebird'),
    fs = require('fs'),
    _ = require('lodash'),
    PDFDocument = require('pdfkit');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

module.exports.init = () => {
    console.log('OK, Lets go');
    listBuckets().then(buckets => getBucketsACL(buckets)).then(result => {
        result = groupByPermission(result);
        return writeIntoPDF(result);
    }).then(() => {
        console.log('DONE, result saved into file s3ACL.pdf in current folder');
    }).catch(err => {
        console.log('err', err)
        console.log('Oops! Something happened. If you have problems please feel free and write to me vkkis1993@gmail.com');
        console.log('And send error which you got above ');
        process.exit(1);
    })
}

function listBuckets() {
    return new Promise((resolve, reject) => {
        s3.listBuckets(function(err, data) {
            if (err) return reject(err); // an error occurred
            resolve(data.Buckets); // successful response
        })
    });
}

function getBucketsACL(buckets) {
    return Promise.map(buckets, (bucket) => {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucket.Name
            };
            s3.getBucketAcl(params, function(err, data) {
                if (err) return reject(err); // an error occurred
                bucket.permissions = data.Grants;
                resolve(bucket);
            });
        });
    });
}

function writeIntoPDF(buckets) {
    const pdf = new PDFDocument({
        size: 'LEGAL',
        info: {
            Title: 'AWS S3 List of Buckets and ACL',
            Author: 'Viktor Kis',
        }
    });
    buckets.forEach(bucket => {
            pdf.text(`[${bucket.Name}]`, {
                align: 'center'
            })
            bucket.permissions.forEach(permission => {
                var userPermission = convertPermisionToHumanView(permission.Permissions);
                pdf.text(`${permission.DisplayName} :  ${userPermission}`);
            })
            pdf.text('-------------------------------------------');
        })
        // Stream contents to a file
    pdf.pipe(fs.createWriteStream('./s3ACL.pdf')).on('finish', () => {
        console.log('PDF finished');
    });
    // Close PDF and write file.
    pdf.end();
}


function groupByPermission(result) {
    _.forEach(result, (bucket) => {
        var permissions = _.chain(bucket.permissions)
            .groupBy('Grantee.DisplayName')
            .map(function(value, key) {
                return {
                    DisplayName: (key === 'undefined') ? 'Everyone' : key,
                    Permissions: _.map(value, 'Permission')
                };
            })
            .value();
        bucket.permissions = permissions;
    });
    return result;
}


function convertPermisionToHumanView(permissions) {
    _.forEach(permissions, (permission, i) => {
        var view;
        switch (permission) {
            case 'READ':
                permissions[i] = 'List';
                break;
            case 'WRITE':
                permissions[i] = 'Upload/Delete';
                break;
            case 'READ_ACP':
                permissions[i] = 'View Permissions';
                break;
            case 'WRITE_ACP':
                permissions[i] = 'Edit permissions';
                break;
            case 'FULL_CONTROL':
                permissions[i] = 'Full Control';
                break;
        }
    });
    return permissions;

}
