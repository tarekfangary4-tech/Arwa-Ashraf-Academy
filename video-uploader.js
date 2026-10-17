/* أكاديمية أروى أشرف — مكوّن موحّد لرفع الفيديوهات من الهاتف.
   يُستخدم في الدروس ويمكن إعادة استخدامه في أي قسم يُضاف لاحقًا.
   صلاحيات الرفع تُفرض من Supabase Storage وليست من هذا الملف. */
(function(global){
  'use strict';
  async function upload({client,projectUrl,file,onProgress,bucket='lesson-videos'}){
    if(!global.tus)throw Error('مكتبة رفع الفيديو غير متاحة؛ تحقق من اتصال الإنترنت.');
    if(!file || !file.type.startsWith('video/'))throw Error('اختار ملف فيديو صحيح.');
    if(file.size>50*1024*1024)throw Error('حجم الفيديو أكبر من 50 ميجابايت.');
    const {data,error}=await client.auth.getSession();
    if(error||!data?.session?.access_token)throw Error('انتهت جلسة الدخول؛ سجل دخولك مجددًا.');
    const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'mp4';
    const path=crypto.randomUUID()+'.'+ext;
    const token=data.session.access_token;
    await new Promise((resolve,reject)=>{
      const task=new global.tus.Upload(file,{
        endpoint:projectUrl+'/storage/v1/upload/resumable',
        retryDelays:[0,3000,5000,10000,20000],
        headers:{authorization:'Bearer '+token,apikey:client.supabaseKey||''},
        uploadDataDuringCreation:true,
        removeFingerprintOnSuccess:true,
        metadata:{bucketName:bucket,objectName:path,contentType:file.type,cacheControl:'3600'},
        chunkSize:6*1024*1024,
        onError:reject,
        onProgress:(sent,total)=>onProgress?.(Math.round(sent/total*100)),
        onSuccess:resolve
      });
      task.start();
    });
    return 'storage://'+bucket+'/'+path;
  }
  global.AcademyVideoUploader={upload};
})(window);
