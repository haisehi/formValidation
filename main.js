//đối tượng
function validator(options){
    function getParent(element,selector){
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var selectorRules = {}

    //hàm thực hiện validate
    function validate(inputElement,rule){
        //var errorElement = getParent(inputElement,'.form-group');
        var errorElement = getParent(inputElement,options.formGroup).querySelector(options.errorSelector);
        var errorMessage

        //lấy ra các rules của selector
        var rules = selectorRules[rule.selector]
        //lặp qua từng rules và kiểm tra
        //nếu có lỗi thì dừng việc kiểm tra
        for(var i = 0; i < rules.length; ++i){
            switch(inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector +':checked')
                    )
                    break;
                default:
                    //rule.test(inputElement.value) = rules[i](inputElement.value)
                    errorMessage = rules[i](inputElement.value)
            }

            if(errorMessage) break;
        }

        if(errorMessage){   
            errorElement.innerText = errorMessage
            getParent(inputElement,options.formGroup).classList.add('invalid')
        }else{
            errorElement.innerText =''
            getParent(inputElement,options.formGroup).classList.remove('invalid')
        }
        return !errorMessage
    }
    //lấy elements của form cần validate
    var formElement = document.querySelector(options.form)
    if(formElement){
        //khi ssubmit form
        formElement.onsubmit= function(e){
            e.preventDefault()

            var isFormValid = true;
            //lặp qua từng rules và validate
            options.rules.forEach(function(rule){
            var inputElement = formElement.querySelector(rule.selector)
            var isValid = validate(inputElement, rule)
                if(!isValid){
                    isFormValid = false
                }
            })

            if(isFormValid){
                //trường hợp submit với javascript
                if(typeof options.onSubmit === 'function'){

                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                    var formValues = Array.from(enableInputs).reduce(function(values,input){
                        
                        switch(input.type){
                            case 'radio':
                                values[input.name]=formElement.querySelector('input[name="'+input.name+'"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')){
                                    // values[input.name]='';
                                    return values
                                } 
                                if(!Array.isArray(values[input.name])){
                                    values[input.name]=[];
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'file':
                                values[input.name]=input.files;
                                break;
                            default:
                                values[input.name]=input.value
                        }
                        return values
                    },{})

                    options.onSubmit(formValues)
                }
                //trường hợp submit với hành vi mặc định
                else{
                    formElement.submit()
                }
            }
        }

        //lặp qua mỗi rule và lắng nghe (sự kiện blur,input )
        options.rules.forEach(function(rule){

            //lưu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])){
                selectorRules[rule.selector].push(rule.test)
            }
            else{
                selectorRules[rule.selector] = [rule.test]
            }
            // selectorRules[rule.selector]=rule.test

            var inputElements = formElement.querySelectorAll(rule.selector)

            Array.from(inputElements).forEach(function(inputElement){
                //xử lý trường hợp con trỏ blur khỏi input
                inputElement.onblur = function(){
                    // value:inputElement.value
                    // test func: rule.test
                    // console.log(rule)
                    validate(inputElement, rule)
                }
                //xử lý trường hợp mỗi khi người dùng nhập tại input
                inputElement.oninput = function(){
                    var errorElement = getParent(inputElement,options.formGroup).querySelector(options.errorSelector)
                    errorElement.innerText =''
                    getParent(inputElement,options.formGroup).classList.remove('invalid')
                }
            })            
        })
    }
    // console.log(selectorRules)
}

//định nghĩa rules
//nguyên tắc của các rules
//1.khi có lỗi thì trả ra message lỗi
//2.khi không có lỗi thì không trả ra gì cả
validator.isRequired = function(selector,message){
    return {
        selector: selector,
        test:function(value){
            return value ? undefined : "vui lòng nhập trường này" 
        }
    }
}

validator.isEmail = function(selector,message){
    return {
        selector: selector,
        test:function(value){
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value)? undefined :message || "vui lòng nhập email"
        }
    }
}
validator.minLength = function(selector,min,message){
    return {
        selector: selector,
        test:function(value){
            return value.length >= min && value ? undefined :message || `vui lòng nhập tối thiểu ${min} kí tự`
        }
    }
}
validator.isConfirmed = function(selector,getConfirmValue,message){
    return {
        selector:selector,
        test:function(value){
            return value === getConfirmValue() ? undefined: message || 'Giá trị nhập vào không chính xác'
        }
    }
}