rmdir /s /q meteor-css-modules
xcopy /y /exclude:prepare-exclude.list *.* meteor-css-modules\
xcopy /y /exclude:prepare-exclude.list helpers meteor-css-modules\helpers\
xcopy /y /exclude:prepare-exclude.list package meteor-css-modules\package\

